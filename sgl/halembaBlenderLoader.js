// http://www.atmind.nl/blender/mystery_ot_blend.html


class BlenderFile {
	constructor() 
	{
		this.readPtr = 0;
		this.ptrSize = 4; // 4 * 8 = 32 bit
	}
	loadFile(path, callback) {
		var othis = this;
		this.ajaxRequest(path, function(ajax) {
			var arrayBuffer = ajax.response; // Note: not oReq.responseText
			othis. readPtr = 0;
		  if (arrayBuffer) 
				callback( othis.parseFile( new DataView(arrayBuffer) ) );
			else
				callback(null);
		});	
	}
	parseFile(data) {
		this.d = new DataStream(data);
		this.readHeader();
		this.fileBlocks = [];
		while ( !this.d.isEOF() ){
			var fileblock = this.readFileBlockInfo();
			//if ( fileblock. identefier !== "DATA")
			this.fileBlocks.push(fileblock);

			if ( fileblock. identefier === "DNA1" )
				this.parseDnaBlock(fileblock);
			if ( fileblock. identefier == "ENDB" )
				break;
		}
		console.log("file load done");
		return 
	}
	ajaxRequest(url, callback) {
    var ajax;
    if(typeof XMLHttpRequest !== 'undefined')
        ajax = new XMLHttpRequest();
    else {
        var versions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"]
        for(var i = 0 ; i < versions.length; i++) {
            try { ajax = new ActiveXObject(versions[i]); break; }catch(e){}
        }
    }

    ajax.onreadystatechange = function () {
        if(ajax.readyState === 4 && (ajax.status >= 200 && ajax.status < 300))
            callback(ajax);
    }
    ajax.open('POST', url, true);
    ajax.responseType = "arraybuffer";
    ajax.setRequestHeader('Content-Type', 'application/octet-stream');
    ajax.send();
	}
	readHeader() {
		this.magicCode = this.d.getNextString( 7 );
		if ( this.magicCode !== "BLENDER" )
			throw "No BlenderFile";

		this.d.setPtrSize( this.d.getNextChar() === "_" ? 4 : 8);
		this.d.setEndian( this.d.getNextChar() === "v" ? DataStream.LittelEndian : DataStream.BigEndian );
		this.version = this.d.getNextString( 3 );
		return ;
	}
	readFileBlockInfo() {
		var fileBlock = {};
		fileBlock. identefier = this.d.getNextString( 4 );
		fileBlock. datasize = this.d.getNextInt( );
		this.d.skipPtr();
		fileBlock. sDNA_Idx = this.d.getNextInt( );
		fileBlock. structCount = this.d.getNextInt( );
		fileBlock. dataOffset = this.d. readPtr;
		this.d.skipData(fileBlock. datasize);

		return fileBlock;
	}
	parseDnaBlock(fileblock) {
		this.DNA = {};

		this.d.setPtr( fileblock. dataOffset );
		this.DNA. identefier = this.d.getNextString( 4 );
		this.DNA. names = [];
		this.DNA. types = [];
		this.DNA. lenght = [];
		this.DNA. lenghtMap = new Map();
		this.DNA. structures = [];

		var typesNames = [];

		for (var a = 0; a < 4 ; a++)
		{
			var fieldId = this.d.getNextString( 4 );
			if ( fieldId === "NAME") {
				var names = this.d.getNextInt( );
				for (var i = 0; i < names; i++) 
					this.DNA. names.push( this.d.getNextNtString() );				
			}
			else if (fieldId === "TYPE") {
				var types = this.d.getNextInt( );				
				for (var i = 0; i < types; i++) 
					this.DNA. types.push( this.d.getNextNtString() );				
			}
			else if (fieldId === "TLEN") {
				for (var i = 0; i < types; i++) {
					var size = this.d.getNextShort() ;
					this.DNA. lenght.push( size );	
					this.DNA. lenghtMap.set(  this.DNA. types[i], size );	
				}
			}
			else if (fieldId === "STRC") {
				var structures = this.d.getNextInt( );
				for (var i = 0; i < structures; i++) {
					var struct = {};
					struct. name =  this.DNA. types[this.d.getNextShort()];
					struct. fields = [];
					struct. types = [];
					var fieldCount = this.d.getNextShort();
					for (var ii = 0; ii < fieldCount; ii++) {
						struct. types.push( this.DNA. types[this.d.getNextShort()]);
						struct. fields.push( this.DNA. names[this.d.getNextShort()]);
					}
					this.DNA. structures.push(struct);				
				}
			}
			this.d.realignPtr(4);
		}
	}

};

class DataStream {
	constructor(data) {
		this.data = data;
		this.readPtr = 0;
	}
	setEndian(endian) {
		this.endian = ( endian == DataStream.LittelEndian);
	}
	setPtrSize(size) {
		if ( size > 8 )
			size /= 8;

		this.bigData = ( size == 8 );
	}
	isEOF() {
		return (  this.readPtr >=  this.data.byteLength );
	}
	setPtr( pos ) {
		if ( pos <  this.data.byteLength)
			  this.readPtr = pos;
	}
	realignPtr(fieldsize) {
		if ( !this.isEOF() )
			this.readPtr =  this.readPtr + ( 4- ( this.readPtr % 4));

	}



	skipData( count )	{		
		this.readPtr += count;
	};
	skipPtr( )	{	
		this.readPtr += 4;
		if (  this.bigData )
			this.readPtr += 4;
	};


	getString(start, length, ignorePtr)	{
		var str = "";
		for (var i = start; i < start+length; i++) 
			str += String.fromCharCode( this.data.getUint8(i));

		if ( ignorePtr === undefined || ignorePtr === false )
			this.readPtr = start + length;
		return str;
	};
	getNextString( length, ignorePtr )	{		
		return this.getString( this.readPtr, length, ignorePtr );
	};
	getNextNtString () {
		var str = "";
		var char = 0;
		do {
			char =  this.data.getUint8( this.readPtr);
			this.readPtr += 1;
			if ( char === 0)
				break;
			str += String.fromCharCode(char);
		} while (true);
		return str;
	}
	getNextChar( ignorePtr )	{		
		return this.getString( this.readPtr, 1, ignorePtr );
	};
	getInt( start, ignorePtr )	{	
		var value;
		value =  this.data.getInt32( this.readPtr,  this.endian);
		if ( ignorePtr === undefined || ignorePtr === false )
			this.readPtr = start + 4;
		
		return value;
	};
	getNextInt( ignorePtr )	{	
		return this.getInt( this.readPtr, ignorePtr);
	};

	getShort( start, ignorePtr )	{	
		var value;
		value =  this.data.getInt16( this.readPtr,  this.endian);
		if ( ignorePtr === undefined || ignorePtr === false )
			this.readPtr = start + 2;
		
		return value;
	};
	getNextShort( ignorePtr )	{	
		return this.getShort( this.readPtr, ignorePtr);
	};
}

DataStream.LittelEndian = 0;
DataStream.BigEndian = 1;

//////////// ajax imp
