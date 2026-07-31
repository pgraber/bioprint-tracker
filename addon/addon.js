/*
@rootVar: BioprintTracker
@name: Bioprint Tracker
@description: Register RASTRUM and Allegro bioprinter runs in eLabNext: upload a .rastrum as a reusable template, then log each run as barcoded, per-plate records
@author: Philipp Graber
@version: 1.1.0
*/

/* --- inlined: JSZip 3.10.1 (MIT) --- */
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=e()}}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t="function"==typeof require&&require;if(!e&&t)return t(r,!0);if(l)return l(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){"use strict";var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return-1^e}(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,r=n(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(e){o.error(e)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,!0,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s)}return t.zipComment.length&&(h.comment=t.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,!0);var a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return"/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function h(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n)},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n)}catch(e){(t=new l("error")).error(e)}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){"use strict";t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case"base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e)}catch(e){r(e)}n=[]}).resume()})}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){h.delay(t,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null}function l(){n.call(this,"utf-8 encode")}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i))}return r.join("/")},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&!0!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker))}catch(e){(t=new h("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var e,t;n=!0;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length}n=!1}l.exports=function(e){1!==h.push(e)||n||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e)}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e)})}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function d(t,e){var r=!1;function n(e){r||(r=!0,l.reject(t,e))}function i(e){r||(r=!0,l.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e)},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e)},h.prototype.callRejected=function(e){l.reject(this.promise,e)},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e)},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else{e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=!0,l.resolve(o,s))},function(e){i||(i=!0,l.reject(o,e))})}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=!1;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=!0,l.resolve(s,e))},function(e){n||(n=!0,l.reject(s,e))});var a;return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header)}function o(e,t){var r=new a(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e)},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,o(e,t)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var h=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i)}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}},{}],46:[function(e,t,r){"use strict";var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return(e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm)}function U(e,t){e.pending_buf[e.pending++]=t}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a]}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,!1),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return(e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,!1),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,!1),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else{var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p}},{}],49:[function(e,t,r){"use strict";var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=!0;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=!1}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===e||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function L(e,t,r){P(e,r[2*t],r[2*t+1])}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o))}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t)}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(e,t),Z(s,u,e.bl_count)}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4))}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4)}}n(T);var q=!1;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),n&&(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r}(e,t,r,!0)}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p)}(),q=!0),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e)},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){(function(e){!function(r,n){"use strict";if(!r.setImmediate){var i,s,t,a,o=1,h={},u=!1,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e)})}:function(){if(r.postMessage&&!r.importScripts){var e=!0,t=r.onmessage;return r.onmessage=function(){e=!1},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,!1):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*")}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data)},function(e){t.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null},s.appendChild(t)}):function(e){setTimeout(c,0,e)},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f}function f(e){delete h[e]}function c(e){if(u)setTimeout(c,0,e);else{var t=h[e];if(t){u=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{f(e),u=!1}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length))}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[10])(10)});
/* --- inlined: js-yaml 4.1.0 (MIT) --- */
/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).jsyaml={})}(this,(function(e){"use strict";function t(e){return null==e}var n={isNothing:t,isObject:function(e){return"object"==typeof e&&null!==e},toArray:function(e){return Array.isArray(e)?e:t(e)?[]:[e]},repeat:function(e,t){var n,i="";for(n=0;n<t;n+=1)i+=e;return i},isNegativeZero:function(e){return 0===e&&Number.NEGATIVE_INFINITY===1/e},extend:function(e,t){var n,i,r,o;if(t)for(n=0,i=(o=Object.keys(t)).length;n<i;n+=1)e[r=o[n]]=t[r];return e}};function i(e,t){var n="",i=e.reason||"(unknown reason)";return e.mark?(e.mark.name&&(n+='in "'+e.mark.name+'" '),n+="("+(e.mark.line+1)+":"+(e.mark.column+1)+")",!t&&e.mark.snippet&&(n+="\n\n"+e.mark.snippet),i+" "+n):i}function r(e,t){Error.call(this),this.name="YAMLException",this.reason=e,this.mark=t,this.message=i(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=(new Error).stack||""}r.prototype=Object.create(Error.prototype),r.prototype.constructor=r,r.prototype.toString=function(e){return this.name+": "+i(this,e)};var o=r;function a(e,t,n,i,r){var o="",a="",l=Math.floor(r/2)-1;return i-t>l&&(t=i-l+(o=" ... ").length),n-i>l&&(n=i+l-(a=" ...").length),{str:o+e.slice(t,n).replace(/\t/g,"→")+a,pos:i-t+o.length}}function l(e,t){return n.repeat(" ",t-e.length)+e}var c=function(e,t){if(t=Object.create(t||null),!e.buffer)return null;t.maxLength||(t.maxLength=79),"number"!=typeof t.indent&&(t.indent=1),"number"!=typeof t.linesBefore&&(t.linesBefore=3),"number"!=typeof t.linesAfter&&(t.linesAfter=2);for(var i,r=/\r?\n|\r|\0/g,o=[0],c=[],s=-1;i=r.exec(e.buffer);)c.push(i.index),o.push(i.index+i[0].length),e.position<=i.index&&s<0&&(s=o.length-2);s<0&&(s=o.length-1);var u,p,f="",d=Math.min(e.line+t.linesAfter,c.length).toString().length,h=t.maxLength-(t.indent+d+3);for(u=1;u<=t.linesBefore&&!(s-u<0);u++)p=a(e.buffer,o[s-u],c[s-u],e.position-(o[s]-o[s-u]),h),f=n.repeat(" ",t.indent)+l((e.line-u+1).toString(),d)+" | "+p.str+"\n"+f;for(p=a(e.buffer,o[s],c[s],e.position,h),f+=n.repeat(" ",t.indent)+l((e.line+1).toString(),d)+" | "+p.str+"\n",f+=n.repeat("-",t.indent+d+3+p.pos)+"^\n",u=1;u<=t.linesAfter&&!(s+u>=c.length);u++)p=a(e.buffer,o[s+u],c[s+u],e.position-(o[s]-o[s+u]),h),f+=n.repeat(" ",t.indent)+l((e.line+u+1).toString(),d)+" | "+p.str+"\n";return f.replace(/\n$/,"")},s=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],u=["scalar","sequence","mapping"];var p=function(e,t){if(t=t||{},Object.keys(t).forEach((function(t){if(-1===s.indexOf(t))throw new o('Unknown option "'+t+'" is met in definition of "'+e+'" YAML type.')})),this.options=t,this.tag=e,this.kind=t.kind||null,this.resolve=t.resolve||function(){return!0},this.construct=t.construct||function(e){return e},this.instanceOf=t.instanceOf||null,this.predicate=t.predicate||null,this.represent=t.represent||null,this.representName=t.representName||null,this.defaultStyle=t.defaultStyle||null,this.multi=t.multi||!1,this.styleAliases=function(e){var t={};return null!==e&&Object.keys(e).forEach((function(n){e[n].forEach((function(e){t[String(e)]=n}))})),t}(t.styleAliases||null),-1===u.indexOf(this.kind))throw new o('Unknown kind "'+this.kind+'" is specified for "'+e+'" YAML type.')};function f(e,t){var n=[];return e[t].forEach((function(e){var t=n.length;n.forEach((function(n,i){n.tag===e.tag&&n.kind===e.kind&&n.multi===e.multi&&(t=i)})),n[t]=e})),n}function d(e){return this.extend(e)}d.prototype.extend=function(e){var t=[],n=[];if(e instanceof p)n.push(e);else if(Array.isArray(e))n=n.concat(e);else{if(!e||!Array.isArray(e.implicit)&&!Array.isArray(e.explicit))throw new o("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");e.implicit&&(t=t.concat(e.implicit)),e.explicit&&(n=n.concat(e.explicit))}t.forEach((function(e){if(!(e instanceof p))throw new o("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(e.loadKind&&"scalar"!==e.loadKind)throw new o("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(e.multi)throw new o("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")})),n.forEach((function(e){if(!(e instanceof p))throw new o("Specified list of YAML types (or a single Type object) contains a non-Type object.")}));var i=Object.create(d.prototype);return i.implicit=(this.implicit||[]).concat(t),i.explicit=(this.explicit||[]).concat(n),i.compiledImplicit=f(i,"implicit"),i.compiledExplicit=f(i,"explicit"),i.compiledTypeMap=function(){var e,t,n={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}};function i(e){e.multi?(n.multi[e.kind].push(e),n.multi.fallback.push(e)):n[e.kind][e.tag]=n.fallback[e.tag]=e}for(e=0,t=arguments.length;e<t;e+=1)arguments[e].forEach(i);return n}(i.compiledImplicit,i.compiledExplicit),i};var h=d,g=new p("tag:yaml.org,2002:str",{kind:"scalar",construct:function(e){return null!==e?e:""}}),m=new p("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(e){return null!==e?e:[]}}),y=new p("tag:yaml.org,2002:map",{kind:"mapping",construct:function(e){return null!==e?e:{}}}),b=new h({explicit:[g,m,y]});var A=new p("tag:yaml.org,2002:null",{kind:"scalar",resolve:function(e){if(null===e)return!0;var t=e.length;return 1===t&&"~"===e||4===t&&("null"===e||"Null"===e||"NULL"===e)},construct:function(){return null},predicate:function(e){return null===e},represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"},empty:function(){return""}},defaultStyle:"lowercase"});var v=new p("tag:yaml.org,2002:bool",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t=e.length;return 4===t&&("true"===e||"True"===e||"TRUE"===e)||5===t&&("false"===e||"False"===e||"FALSE"===e)},construct:function(e){return"true"===e||"True"===e||"TRUE"===e},predicate:function(e){return"[object Boolean]"===Object.prototype.toString.call(e)},represent:{lowercase:function(e){return e?"true":"false"},uppercase:function(e){return e?"TRUE":"FALSE"},camelcase:function(e){return e?"True":"False"}},defaultStyle:"lowercase"});function w(e){return 48<=e&&e<=55}function k(e){return 48<=e&&e<=57}var C=new p("tag:yaml.org,2002:int",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i=e.length,r=0,o=!1;if(!i)return!1;if("-"!==(t=e[r])&&"+"!==t||(t=e[++r]),"0"===t){if(r+1===i)return!0;if("b"===(t=e[++r])){for(r++;r<i;r++)if("_"!==(t=e[r])){if("0"!==t&&"1"!==t)return!1;o=!0}return o&&"_"!==t}if("x"===t){for(r++;r<i;r++)if("_"!==(t=e[r])){if(!(48<=(n=e.charCodeAt(r))&&n<=57||65<=n&&n<=70||97<=n&&n<=102))return!1;o=!0}return o&&"_"!==t}if("o"===t){for(r++;r<i;r++)if("_"!==(t=e[r])){if(!w(e.charCodeAt(r)))return!1;o=!0}return o&&"_"!==t}}if("_"===t)return!1;for(;r<i;r++)if("_"!==(t=e[r])){if(!k(e.charCodeAt(r)))return!1;o=!0}return!(!o||"_"===t)},construct:function(e){var t,n=e,i=1;if(-1!==n.indexOf("_")&&(n=n.replace(/_/g,"")),"-"!==(t=n[0])&&"+"!==t||("-"===t&&(i=-1),t=(n=n.slice(1))[0]),"0"===n)return 0;if("0"===t){if("b"===n[1])return i*parseInt(n.slice(2),2);if("x"===n[1])return i*parseInt(n.slice(2),16);if("o"===n[1])return i*parseInt(n.slice(2),8)}return i*parseInt(n,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&e%1==0&&!n.isNegativeZero(e)},represent:{binary:function(e){return e>=0?"0b"+e.toString(2):"-0b"+e.toString(2).slice(1)},octal:function(e){return e>=0?"0o"+e.toString(8):"-0o"+e.toString(8).slice(1)},decimal:function(e){return e.toString(10)},hexadecimal:function(e){return e>=0?"0x"+e.toString(16).toUpperCase():"-0x"+e.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}}),x=new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");var I=/^[-+]?[0-9]+e/;var S=new p("tag:yaml.org,2002:float",{kind:"scalar",resolve:function(e){return null!==e&&!(!x.test(e)||"_"===e[e.length-1])},construct:function(e){var t,n;return n="-"===(t=e.replace(/_/g,"").toLowerCase())[0]?-1:1,"+-".indexOf(t[0])>=0&&(t=t.slice(1)),".inf"===t?1===n?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:".nan"===t?NaN:n*parseFloat(t,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&(e%1!=0||n.isNegativeZero(e))},represent:function(e,t){var i;if(isNaN(e))switch(t){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===e)switch(t){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===e)switch(t){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(n.isNegativeZero(e))return"-0.0";return i=e.toString(10),I.test(i)?i.replace("e",".e"):i},defaultStyle:"lowercase"}),O=b.extend({implicit:[A,v,C,S]}),j=O,T=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),N=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");var F=new p("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:function(e){return null!==e&&(null!==T.exec(e)||null!==N.exec(e))},construct:function(e){var t,n,i,r,o,a,l,c,s=0,u=null;if(null===(t=T.exec(e))&&(t=N.exec(e)),null===t)throw new Error("Date resolve error");if(n=+t[1],i=+t[2]-1,r=+t[3],!t[4])return new Date(Date.UTC(n,i,r));if(o=+t[4],a=+t[5],l=+t[6],t[7]){for(s=t[7].slice(0,3);s.length<3;)s+="0";s=+s}return t[9]&&(u=6e4*(60*+t[10]+ +(t[11]||0)),"-"===t[9]&&(u=-u)),c=new Date(Date.UTC(n,i,r,o,a,l,s)),u&&c.setTime(c.getTime()-u),c},instanceOf:Date,represent:function(e){return e.toISOString()}});var E=new p("tag:yaml.org,2002:merge",{kind:"scalar",resolve:function(e){return"<<"===e||null===e}}),M="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";var L=new p("tag:yaml.org,2002:binary",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,n,i=0,r=e.length,o=M;for(n=0;n<r;n++)if(!((t=o.indexOf(e.charAt(n)))>64)){if(t<0)return!1;i+=6}return i%8==0},construct:function(e){var t,n,i=e.replace(/[\r\n=]/g,""),r=i.length,o=M,a=0,l=[];for(t=0;t<r;t++)t%4==0&&t&&(l.push(a>>16&255),l.push(a>>8&255),l.push(255&a)),a=a<<6|o.indexOf(i.charAt(t));return 0===(n=r%4*6)?(l.push(a>>16&255),l.push(a>>8&255),l.push(255&a)):18===n?(l.push(a>>10&255),l.push(a>>2&255)):12===n&&l.push(a>>4&255),new Uint8Array(l)},predicate:function(e){return"[object Uint8Array]"===Object.prototype.toString.call(e)},represent:function(e){var t,n,i="",r=0,o=e.length,a=M;for(t=0;t<o;t++)t%3==0&&t&&(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]),r=(r<<8)+e[t];return 0===(n=o%3)?(i+=a[r>>18&63],i+=a[r>>12&63],i+=a[r>>6&63],i+=a[63&r]):2===n?(i+=a[r>>10&63],i+=a[r>>4&63],i+=a[r<<2&63],i+=a[64]):1===n&&(i+=a[r>>2&63],i+=a[r<<4&63],i+=a[64],i+=a[64]),i}}),_=Object.prototype.hasOwnProperty,D=Object.prototype.toString;var U=new p("tag:yaml.org,2002:omap",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=[],l=e;for(t=0,n=l.length;t<n;t+=1){if(i=l[t],o=!1,"[object Object]"!==D.call(i))return!1;for(r in i)if(_.call(i,r)){if(o)return!1;o=!0}if(!o)return!1;if(-1!==a.indexOf(r))return!1;a.push(r)}return!0},construct:function(e){return null!==e?e:[]}}),q=Object.prototype.toString;var Y=new p("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1){if(i=a[t],"[object Object]"!==q.call(i))return!1;if(1!==(r=Object.keys(i)).length)return!1;o[t]=[r[0],i[r[0]]]}return!0},construct:function(e){if(null===e)return[];var t,n,i,r,o,a=e;for(o=new Array(a.length),t=0,n=a.length;t<n;t+=1)i=a[t],r=Object.keys(i),o[t]=[r[0],i[r[0]]];return o}}),R=Object.prototype.hasOwnProperty;var B=new p("tag:yaml.org,2002:set",{kind:"mapping",resolve:function(e){if(null===e)return!0;var t,n=e;for(t in n)if(R.call(n,t)&&null!==n[t])return!1;return!0},construct:function(e){return null!==e?e:{}}}),K=j.extend({implicit:[F,E],explicit:[L,U,Y,B]}),P=Object.prototype.hasOwnProperty,W=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,H=/[\x85\u2028\u2029]/,$=/[,\[\]\{\}]/,G=/^(?:!|!!|![a-z\-]+!)$/i,V=/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;function Z(e){return Object.prototype.toString.call(e)}function J(e){return 10===e||13===e}function Q(e){return 9===e||32===e}function z(e){return 9===e||32===e||10===e||13===e}function X(e){return 44===e||91===e||93===e||123===e||125===e}function ee(e){var t;return 48<=e&&e<=57?e-48:97<=(t=32|e)&&t<=102?t-97+10:-1}function te(e){return 48===e?"\0":97===e?"":98===e?"\b":116===e||9===e?"\t":110===e?"\n":118===e?"\v":102===e?"\f":114===e?"\r":101===e?"":32===e?" ":34===e?'"':47===e?"/":92===e?"\\":78===e?"":95===e?" ":76===e?"\u2028":80===e?"\u2029":""}function ne(e){return e<=65535?String.fromCharCode(e):String.fromCharCode(55296+(e-65536>>10),56320+(e-65536&1023))}for(var ie=new Array(256),re=new Array(256),oe=0;oe<256;oe++)ie[oe]=te(oe)?1:0,re[oe]=te(oe);function ae(e,t){this.input=e,this.filename=t.filename||null,this.schema=t.schema||K,this.onWarning=t.onWarning||null,this.legacy=t.legacy||!1,this.json=t.json||!1,this.listener=t.listener||null,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=e.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.firstTabInLine=-1,this.documents=[]}function le(e,t){var n={name:e.filename,buffer:e.input.slice(0,-1),position:e.position,line:e.line,column:e.position-e.lineStart};return n.snippet=c(n),new o(t,n)}function ce(e,t){throw le(e,t)}function se(e,t){e.onWarning&&e.onWarning.call(null,le(e,t))}var ue={YAML:function(e,t,n){var i,r,o;null!==e.version&&ce(e,"duplication of %YAML directive"),1!==n.length&&ce(e,"YAML directive accepts exactly one argument"),null===(i=/^([0-9]+)\.([0-9]+)$/.exec(n[0]))&&ce(e,"ill-formed argument of the YAML directive"),r=parseInt(i[1],10),o=parseInt(i[2],10),1!==r&&ce(e,"unacceptable YAML version of the document"),e.version=n[0],e.checkLineBreaks=o<2,1!==o&&2!==o&&se(e,"unsupported YAML version of the document")},TAG:function(e,t,n){var i,r;2!==n.length&&ce(e,"TAG directive accepts exactly two arguments"),i=n[0],r=n[1],G.test(i)||ce(e,"ill-formed tag handle (first argument) of the TAG directive"),P.call(e.tagMap,i)&&ce(e,'there is a previously declared suffix for "'+i+'" tag handle'),V.test(r)||ce(e,"ill-formed tag prefix (second argument) of the TAG directive");try{r=decodeURIComponent(r)}catch(t){ce(e,"tag prefix is malformed: "+r)}e.tagMap[i]=r}};function pe(e,t,n,i){var r,o,a,l;if(t<n){if(l=e.input.slice(t,n),i)for(r=0,o=l.length;r<o;r+=1)9===(a=l.charCodeAt(r))||32<=a&&a<=1114111||ce(e,"expected valid JSON character");else W.test(l)&&ce(e,"the stream contains non-printable characters");e.result+=l}}function fe(e,t,i,r){var o,a,l,c;for(n.isObject(i)||ce(e,"cannot merge mappings; the provided source object is unacceptable"),l=0,c=(o=Object.keys(i)).length;l<c;l+=1)a=o[l],P.call(t,a)||(t[a]=i[a],r[a]=!0)}function de(e,t,n,i,r,o,a,l,c){var s,u;if(Array.isArray(r))for(s=0,u=(r=Array.prototype.slice.call(r)).length;s<u;s+=1)Array.isArray(r[s])&&ce(e,"nested arrays are not supported inside keys"),"object"==typeof r&&"[object Object]"===Z(r[s])&&(r[s]="[object Object]");if("object"==typeof r&&"[object Object]"===Z(r)&&(r="[object Object]"),r=String(r),null===t&&(t={}),"tag:yaml.org,2002:merge"===i)if(Array.isArray(o))for(s=0,u=o.length;s<u;s+=1)fe(e,t,o[s],n);else fe(e,t,o,n);else e.json||P.call(n,r)||!P.call(t,r)||(e.line=a||e.line,e.lineStart=l||e.lineStart,e.position=c||e.position,ce(e,"duplicated mapping key")),"__proto__"===r?Object.defineProperty(t,r,{configurable:!0,enumerable:!0,writable:!0,value:o}):t[r]=o,delete n[r];return t}function he(e){var t;10===(t=e.input.charCodeAt(e.position))?e.position++:13===t?(e.position++,10===e.input.charCodeAt(e.position)&&e.position++):ce(e,"a line break is expected"),e.line+=1,e.lineStart=e.position,e.firstTabInLine=-1}function ge(e,t,n){for(var i=0,r=e.input.charCodeAt(e.position);0!==r;){for(;Q(r);)9===r&&-1===e.firstTabInLine&&(e.firstTabInLine=e.position),r=e.input.charCodeAt(++e.position);if(t&&35===r)do{r=e.input.charCodeAt(++e.position)}while(10!==r&&13!==r&&0!==r);if(!J(r))break;for(he(e),r=e.input.charCodeAt(e.position),i++,e.lineIndent=0;32===r;)e.lineIndent++,r=e.input.charCodeAt(++e.position)}return-1!==n&&0!==i&&e.lineIndent<n&&se(e,"deficient indentation"),i}function me(e){var t,n=e.position;return!(45!==(t=e.input.charCodeAt(n))&&46!==t||t!==e.input.charCodeAt(n+1)||t!==e.input.charCodeAt(n+2)||(n+=3,0!==(t=e.input.charCodeAt(n))&&!z(t)))}function ye(e,t){1===t?e.result+=" ":t>1&&(e.result+=n.repeat("\n",t-1))}function be(e,t){var n,i,r=e.tag,o=e.anchor,a=[],l=!1;if(-1!==e.firstTabInLine)return!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=a),i=e.input.charCodeAt(e.position);0!==i&&(-1!==e.firstTabInLine&&(e.position=e.firstTabInLine,ce(e,"tab characters must not be used in indentation")),45===i)&&z(e.input.charCodeAt(e.position+1));)if(l=!0,e.position++,ge(e,!0,-1)&&e.lineIndent<=t)a.push(null),i=e.input.charCodeAt(e.position);else if(n=e.line,we(e,t,3,!1,!0),a.push(e.result),ge(e,!0,-1),i=e.input.charCodeAt(e.position),(e.line===n||e.lineIndent>t)&&0!==i)ce(e,"bad indentation of a sequence entry");else if(e.lineIndent<t)break;return!!l&&(e.tag=r,e.anchor=o,e.kind="sequence",e.result=a,!0)}function Ae(e){var t,n,i,r,o=!1,a=!1;if(33!==(r=e.input.charCodeAt(e.position)))return!1;if(null!==e.tag&&ce(e,"duplication of a tag property"),60===(r=e.input.charCodeAt(++e.position))?(o=!0,r=e.input.charCodeAt(++e.position)):33===r?(a=!0,n="!!",r=e.input.charCodeAt(++e.position)):n="!",t=e.position,o){do{r=e.input.charCodeAt(++e.position)}while(0!==r&&62!==r);e.position<e.length?(i=e.input.slice(t,e.position),r=e.input.charCodeAt(++e.position)):ce(e,"unexpected end of the stream within a verbatim tag")}else{for(;0!==r&&!z(r);)33===r&&(a?ce(e,"tag suffix cannot contain exclamation marks"):(n=e.input.slice(t-1,e.position+1),G.test(n)||ce(e,"named tag handle cannot contain such characters"),a=!0,t=e.position+1)),r=e.input.charCodeAt(++e.position);i=e.input.slice(t,e.position),$.test(i)&&ce(e,"tag suffix cannot contain flow indicator characters")}i&&!V.test(i)&&ce(e,"tag name cannot contain such characters: "+i);try{i=decodeURIComponent(i)}catch(t){ce(e,"tag name is malformed: "+i)}return o?e.tag=i:P.call(e.tagMap,n)?e.tag=e.tagMap[n]+i:"!"===n?e.tag="!"+i:"!!"===n?e.tag="tag:yaml.org,2002:"+i:ce(e,'undeclared tag handle "'+n+'"'),!0}function ve(e){var t,n;if(38!==(n=e.input.charCodeAt(e.position)))return!1;for(null!==e.anchor&&ce(e,"duplication of an anchor property"),n=e.input.charCodeAt(++e.position),t=e.position;0!==n&&!z(n)&&!X(n);)n=e.input.charCodeAt(++e.position);return e.position===t&&ce(e,"name of an anchor node must contain at least one character"),e.anchor=e.input.slice(t,e.position),!0}function we(e,t,i,r,o){var a,l,c,s,u,p,f,d,h,g=1,m=!1,y=!1;if(null!==e.listener&&e.listener("open",e),e.tag=null,e.anchor=null,e.kind=null,e.result=null,a=l=c=4===i||3===i,r&&ge(e,!0,-1)&&(m=!0,e.lineIndent>t?g=1:e.lineIndent===t?g=0:e.lineIndent<t&&(g=-1)),1===g)for(;Ae(e)||ve(e);)ge(e,!0,-1)?(m=!0,c=a,e.lineIndent>t?g=1:e.lineIndent===t?g=0:e.lineIndent<t&&(g=-1)):c=!1;if(c&&(c=m||o),1!==g&&4!==i||(d=1===i||2===i?t:t+1,h=e.position-e.lineStart,1===g?c&&(be(e,h)||function(e,t,n){var i,r,o,a,l,c,s,u=e.tag,p=e.anchor,f={},d=Object.create(null),h=null,g=null,m=null,y=!1,b=!1;if(-1!==e.firstTabInLine)return!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=f),s=e.input.charCodeAt(e.position);0!==s;){if(y||-1===e.firstTabInLine||(e.position=e.firstTabInLine,ce(e,"tab characters must not be used in indentation")),i=e.input.charCodeAt(e.position+1),o=e.line,63!==s&&58!==s||!z(i)){if(a=e.line,l=e.lineStart,c=e.position,!we(e,n,2,!1,!0))break;if(e.line===o){for(s=e.input.charCodeAt(e.position);Q(s);)s=e.input.charCodeAt(++e.position);if(58===s)z(s=e.input.charCodeAt(++e.position))||ce(e,"a whitespace character is expected after the key-value separator within a block mapping"),y&&(de(e,f,d,h,g,null,a,l,c),h=g=m=null),b=!0,y=!1,r=!1,h=e.tag,g=e.result;else{if(!b)return e.tag=u,e.anchor=p,!0;ce(e,"can not read an implicit mapping pair; a colon is missed")}}else{if(!b)return e.tag=u,e.anchor=p,!0;ce(e,"can not read a block mapping entry; a multiline key may not be an implicit key")}}else 63===s?(y&&(de(e,f,d,h,g,null,a,l,c),h=g=m=null),b=!0,y=!0,r=!0):y?(y=!1,r=!0):ce(e,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),e.position+=1,s=i;if((e.line===o||e.lineIndent>t)&&(y&&(a=e.line,l=e.lineStart,c=e.position),we(e,t,4,!0,r)&&(y?g=e.result:m=e.result),y||(de(e,f,d,h,g,m,a,l,c),h=g=m=null),ge(e,!0,-1),s=e.input.charCodeAt(e.position)),(e.line===o||e.lineIndent>t)&&0!==s)ce(e,"bad indentation of a mapping entry");else if(e.lineIndent<t)break}return y&&de(e,f,d,h,g,null,a,l,c),b&&(e.tag=u,e.anchor=p,e.kind="mapping",e.result=f),b}(e,h,d))||function(e,t){var n,i,r,o,a,l,c,s,u,p,f,d,h=!0,g=e.tag,m=e.anchor,y=Object.create(null);if(91===(d=e.input.charCodeAt(e.position)))a=93,s=!1,o=[];else{if(123!==d)return!1;a=125,s=!0,o={}}for(null!==e.anchor&&(e.anchorMap[e.anchor]=o),d=e.input.charCodeAt(++e.position);0!==d;){if(ge(e,!0,t),(d=e.input.charCodeAt(e.position))===a)return e.position++,e.tag=g,e.anchor=m,e.kind=s?"mapping":"sequence",e.result=o,!0;h?44===d&&ce(e,"expected the node content, but found ','"):ce(e,"missed comma between flow collection entries"),f=null,l=c=!1,63===d&&z(e.input.charCodeAt(e.position+1))&&(l=c=!0,e.position++,ge(e,!0,t)),n=e.line,i=e.lineStart,r=e.position,we(e,t,1,!1,!0),p=e.tag,u=e.result,ge(e,!0,t),d=e.input.charCodeAt(e.position),!c&&e.line!==n||58!==d||(l=!0,d=e.input.charCodeAt(++e.position),ge(e,!0,t),we(e,t,1,!1,!0),f=e.result),s?de(e,o,y,p,u,f,n,i,r):l?o.push(de(e,null,y,p,u,f,n,i,r)):o.push(u),ge(e,!0,t),44===(d=e.input.charCodeAt(e.position))?(h=!0,d=e.input.charCodeAt(++e.position)):h=!1}ce(e,"unexpected end of the stream within a flow collection")}(e,d)?y=!0:(l&&function(e,t){var i,r,o,a,l,c=1,s=!1,u=!1,p=t,f=0,d=!1;if(124===(a=e.input.charCodeAt(e.position)))r=!1;else{if(62!==a)return!1;r=!0}for(e.kind="scalar",e.result="";0!==a;)if(43===(a=e.input.charCodeAt(++e.position))||45===a)1===c?c=43===a?3:2:ce(e,"repeat of a chomping mode identifier");else{if(!((o=48<=(l=a)&&l<=57?l-48:-1)>=0))break;0===o?ce(e,"bad explicit indentation width of a block scalar; it cannot be less than one"):u?ce(e,"repeat of an indentation width identifier"):(p=t+o-1,u=!0)}if(Q(a)){do{a=e.input.charCodeAt(++e.position)}while(Q(a));if(35===a)do{a=e.input.charCodeAt(++e.position)}while(!J(a)&&0!==a)}for(;0!==a;){for(he(e),e.lineIndent=0,a=e.input.charCodeAt(e.position);(!u||e.lineIndent<p)&&32===a;)e.lineIndent++,a=e.input.charCodeAt(++e.position);if(!u&&e.lineIndent>p&&(p=e.lineIndent),J(a))f++;else{if(e.lineIndent<p){3===c?e.result+=n.repeat("\n",s?1+f:f):1===c&&s&&(e.result+="\n");break}for(r?Q(a)?(d=!0,e.result+=n.repeat("\n",s?1+f:f)):d?(d=!1,e.result+=n.repeat("\n",f+1)):0===f?s&&(e.result+=" "):e.result+=n.repeat("\n",f):e.result+=n.repeat("\n",s?1+f:f),s=!0,u=!0,f=0,i=e.position;!J(a)&&0!==a;)a=e.input.charCodeAt(++e.position);pe(e,i,e.position,!1)}}return!0}(e,d)||function(e,t){var n,i,r;if(39!==(n=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,i=r=e.position;0!==(n=e.input.charCodeAt(e.position));)if(39===n){if(pe(e,i,e.position,!0),39!==(n=e.input.charCodeAt(++e.position)))return!0;i=e.position,e.position++,r=e.position}else J(n)?(pe(e,i,r,!0),ye(e,ge(e,!1,t)),i=r=e.position):e.position===e.lineStart&&me(e)?ce(e,"unexpected end of the document within a single quoted scalar"):(e.position++,r=e.position);ce(e,"unexpected end of the stream within a single quoted scalar")}(e,d)||function(e,t){var n,i,r,o,a,l,c;if(34!==(l=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,n=i=e.position;0!==(l=e.input.charCodeAt(e.position));){if(34===l)return pe(e,n,e.position,!0),e.position++,!0;if(92===l){if(pe(e,n,e.position,!0),J(l=e.input.charCodeAt(++e.position)))ge(e,!1,t);else if(l<256&&ie[l])e.result+=re[l],e.position++;else if((a=120===(c=l)?2:117===c?4:85===c?8:0)>0){for(r=a,o=0;r>0;r--)(a=ee(l=e.input.charCodeAt(++e.position)))>=0?o=(o<<4)+a:ce(e,"expected hexadecimal character");e.result+=ne(o),e.position++}else ce(e,"unknown escape sequence");n=i=e.position}else J(l)?(pe(e,n,i,!0),ye(e,ge(e,!1,t)),n=i=e.position):e.position===e.lineStart&&me(e)?ce(e,"unexpected end of the document within a double quoted scalar"):(e.position++,i=e.position)}ce(e,"unexpected end of the stream within a double quoted scalar")}(e,d)?y=!0:!function(e){var t,n,i;if(42!==(i=e.input.charCodeAt(e.position)))return!1;for(i=e.input.charCodeAt(++e.position),t=e.position;0!==i&&!z(i)&&!X(i);)i=e.input.charCodeAt(++e.position);return e.position===t&&ce(e,"name of an alias node must contain at least one character"),n=e.input.slice(t,e.position),P.call(e.anchorMap,n)||ce(e,'unidentified alias "'+n+'"'),e.result=e.anchorMap[n],ge(e,!0,-1),!0}(e)?function(e,t,n){var i,r,o,a,l,c,s,u,p=e.kind,f=e.result;if(z(u=e.input.charCodeAt(e.position))||X(u)||35===u||38===u||42===u||33===u||124===u||62===u||39===u||34===u||37===u||64===u||96===u)return!1;if((63===u||45===u)&&(z(i=e.input.charCodeAt(e.position+1))||n&&X(i)))return!1;for(e.kind="scalar",e.result="",r=o=e.position,a=!1;0!==u;){if(58===u){if(z(i=e.input.charCodeAt(e.position+1))||n&&X(i))break}else if(35===u){if(z(e.input.charCodeAt(e.position-1)))break}else{if(e.position===e.lineStart&&me(e)||n&&X(u))break;if(J(u)){if(l=e.line,c=e.lineStart,s=e.lineIndent,ge(e,!1,-1),e.lineIndent>=t){a=!0,u=e.input.charCodeAt(e.position);continue}e.position=o,e.line=l,e.lineStart=c,e.lineIndent=s;break}}a&&(pe(e,r,o,!1),ye(e,e.line-l),r=o=e.position,a=!1),Q(u)||(o=e.position+1),u=e.input.charCodeAt(++e.position)}return pe(e,r,o,!1),!!e.result||(e.kind=p,e.result=f,!1)}(e,d,1===i)&&(y=!0,null===e.tag&&(e.tag="?")):(y=!0,null===e.tag&&null===e.anchor||ce(e,"alias node should not have any properties")),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):0===g&&(y=c&&be(e,h))),null===e.tag)null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);else if("?"===e.tag){for(null!==e.result&&"scalar"!==e.kind&&ce(e,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+e.kind+'"'),s=0,u=e.implicitTypes.length;s<u;s+=1)if((f=e.implicitTypes[s]).resolve(e.result)){e.result=f.construct(e.result),e.tag=f.tag,null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);break}}else if("!"!==e.tag){if(P.call(e.typeMap[e.kind||"fallback"],e.tag))f=e.typeMap[e.kind||"fallback"][e.tag];else for(f=null,s=0,u=(p=e.typeMap.multi[e.kind||"fallback"]).length;s<u;s+=1)if(e.tag.slice(0,p[s].tag.length)===p[s].tag){f=p[s];break}f||ce(e,"unknown tag !<"+e.tag+">"),null!==e.result&&f.kind!==e.kind&&ce(e,"unacceptable node kind for !<"+e.tag+'> tag; it should be "'+f.kind+'", not "'+e.kind+'"'),f.resolve(e.result,e.tag)?(e.result=f.construct(e.result,e.tag),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):ce(e,"cannot resolve a node with !<"+e.tag+"> explicit tag")}return null!==e.listener&&e.listener("close",e),null!==e.tag||null!==e.anchor||y}function ke(e){var t,n,i,r,o=e.position,a=!1;for(e.version=null,e.checkLineBreaks=e.legacy,e.tagMap=Object.create(null),e.anchorMap=Object.create(null);0!==(r=e.input.charCodeAt(e.position))&&(ge(e,!0,-1),r=e.input.charCodeAt(e.position),!(e.lineIndent>0||37!==r));){for(a=!0,r=e.input.charCodeAt(++e.position),t=e.position;0!==r&&!z(r);)r=e.input.charCodeAt(++e.position);for(i=[],(n=e.input.slice(t,e.position)).length<1&&ce(e,"directive name must not be less than one character in length");0!==r;){for(;Q(r);)r=e.input.charCodeAt(++e.position);if(35===r){do{r=e.input.charCodeAt(++e.position)}while(0!==r&&!J(r));break}if(J(r))break;for(t=e.position;0!==r&&!z(r);)r=e.input.charCodeAt(++e.position);i.push(e.input.slice(t,e.position))}0!==r&&he(e),P.call(ue,n)?ue[n](e,n,i):se(e,'unknown document directive "'+n+'"')}ge(e,!0,-1),0===e.lineIndent&&45===e.input.charCodeAt(e.position)&&45===e.input.charCodeAt(e.position+1)&&45===e.input.charCodeAt(e.position+2)?(e.position+=3,ge(e,!0,-1)):a&&ce(e,"directives end mark is expected"),we(e,e.lineIndent-1,4,!1,!0),ge(e,!0,-1),e.checkLineBreaks&&H.test(e.input.slice(o,e.position))&&se(e,"non-ASCII line breaks are interpreted as content"),e.documents.push(e.result),e.position===e.lineStart&&me(e)?46===e.input.charCodeAt(e.position)&&(e.position+=3,ge(e,!0,-1)):e.position<e.length-1&&ce(e,"end of the stream or a document separator is expected")}function Ce(e,t){t=t||{},0!==(e=String(e)).length&&(10!==e.charCodeAt(e.length-1)&&13!==e.charCodeAt(e.length-1)&&(e+="\n"),65279===e.charCodeAt(0)&&(e=e.slice(1)));var n=new ae(e,t),i=e.indexOf("\0");for(-1!==i&&(n.position=i,ce(n,"null byte is not allowed in input")),n.input+="\0";32===n.input.charCodeAt(n.position);)n.lineIndent+=1,n.position+=1;for(;n.position<n.length-1;)ke(n);return n.documents}var xe={loadAll:function(e,t,n){null!==t&&"object"==typeof t&&void 0===n&&(n=t,t=null);var i=Ce(e,n);if("function"!=typeof t)return i;for(var r=0,o=i.length;r<o;r+=1)t(i[r])},load:function(e,t){var n=Ce(e,t);if(0!==n.length){if(1===n.length)return n[0];throw new o("expected a single document in the stream, but found more")}}},Ie=Object.prototype.toString,Se=Object.prototype.hasOwnProperty,Oe=65279,je={0:"\\0",7:"\\a",8:"\\b",9:"\\t",10:"\\n",11:"\\v",12:"\\f",13:"\\r",27:"\\e",34:'\\"',92:"\\\\",133:"\\N",160:"\\_",8232:"\\L",8233:"\\P"},Te=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],Ne=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Fe(e){var t,i,r;if(t=e.toString(16).toUpperCase(),e<=255)i="x",r=2;else if(e<=65535)i="u",r=4;else{if(!(e<=4294967295))throw new o("code point within a string may not be greater than 0xFFFFFFFF");i="U",r=8}return"\\"+i+n.repeat("0",r-t.length)+t}function Ee(e){this.schema=e.schema||K,this.indent=Math.max(1,e.indent||2),this.noArrayIndent=e.noArrayIndent||!1,this.skipInvalid=e.skipInvalid||!1,this.flowLevel=n.isNothing(e.flowLevel)?-1:e.flowLevel,this.styleMap=function(e,t){var n,i,r,o,a,l,c;if(null===t)return{};for(n={},r=0,o=(i=Object.keys(t)).length;r<o;r+=1)a=i[r],l=String(t[a]),"!!"===a.slice(0,2)&&(a="tag:yaml.org,2002:"+a.slice(2)),(c=e.compiledTypeMap.fallback[a])&&Se.call(c.styleAliases,l)&&(l=c.styleAliases[l]),n[a]=l;return n}(this.schema,e.styles||null),this.sortKeys=e.sortKeys||!1,this.lineWidth=e.lineWidth||80,this.noRefs=e.noRefs||!1,this.noCompatMode=e.noCompatMode||!1,this.condenseFlow=e.condenseFlow||!1,this.quotingType='"'===e.quotingType?2:1,this.forceQuotes=e.forceQuotes||!1,this.replacer="function"==typeof e.replacer?e.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function Me(e,t){for(var i,r=n.repeat(" ",t),o=0,a=-1,l="",c=e.length;o<c;)-1===(a=e.indexOf("\n",o))?(i=e.slice(o),o=c):(i=e.slice(o,a+1),o=a+1),i.length&&"\n"!==i&&(l+=r),l+=i;return l}function Le(e,t){return"\n"+n.repeat(" ",e.indent*t)}function _e(e){return 32===e||9===e}function De(e){return 32<=e&&e<=126||161<=e&&e<=55295&&8232!==e&&8233!==e||57344<=e&&e<=65533&&e!==Oe||65536<=e&&e<=1114111}function Ue(e){return De(e)&&e!==Oe&&13!==e&&10!==e}function qe(e,t,n){var i=Ue(e),r=i&&!_e(e);return(n?i:i&&44!==e&&91!==e&&93!==e&&123!==e&&125!==e)&&35!==e&&!(58===t&&!r)||Ue(t)&&!_e(t)&&35===e||58===t&&r}function Ye(e,t){var n,i=e.charCodeAt(t);return i>=55296&&i<=56319&&t+1<e.length&&(n=e.charCodeAt(t+1))>=56320&&n<=57343?1024*(i-55296)+n-56320+65536:i}function Re(e){return/^\n* /.test(e)}function Be(e,t,n,i,r,o,a,l){var c,s,u=0,p=null,f=!1,d=!1,h=-1!==i,g=-1,m=De(s=Ye(e,0))&&s!==Oe&&!_e(s)&&45!==s&&63!==s&&58!==s&&44!==s&&91!==s&&93!==s&&123!==s&&125!==s&&35!==s&&38!==s&&42!==s&&33!==s&&124!==s&&61!==s&&62!==s&&39!==s&&34!==s&&37!==s&&64!==s&&96!==s&&function(e){return!_e(e)&&58!==e}(Ye(e,e.length-1));if(t||a)for(c=0;c<e.length;u>=65536?c+=2:c++){if(!De(u=Ye(e,c)))return 5;m=m&&qe(u,p,l),p=u}else{for(c=0;c<e.length;u>=65536?c+=2:c++){if(10===(u=Ye(e,c)))f=!0,h&&(d=d||c-g-1>i&&" "!==e[g+1],g=c);else if(!De(u))return 5;m=m&&qe(u,p,l),p=u}d=d||h&&c-g-1>i&&" "!==e[g+1]}return f||d?n>9&&Re(e)?5:a?2===o?5:2:d?4:3:!m||a||r(e)?2===o?5:2:1}function Ke(e,t,n,i,r){e.dump=function(){if(0===t.length)return 2===e.quotingType?'""':"''";if(!e.noCompatMode&&(-1!==Te.indexOf(t)||Ne.test(t)))return 2===e.quotingType?'"'+t+'"':"'"+t+"'";var a=e.indent*Math.max(1,n),l=-1===e.lineWidth?-1:Math.max(Math.min(e.lineWidth,40),e.lineWidth-a),c=i||e.flowLevel>-1&&n>=e.flowLevel;switch(Be(t,c,e.indent,l,(function(t){return function(e,t){var n,i;for(n=0,i=e.implicitTypes.length;n<i;n+=1)if(e.implicitTypes[n].resolve(t))return!0;return!1}(e,t)}),e.quotingType,e.forceQuotes&&!i,r)){case 1:return t;case 2:return"'"+t.replace(/'/g,"''")+"'";case 3:return"|"+Pe(t,e.indent)+We(Me(t,a));case 4:return">"+Pe(t,e.indent)+We(Me(function(e,t){var n,i,r=/(\n+)([^\n]*)/g,o=(l=e.indexOf("\n"),l=-1!==l?l:e.length,r.lastIndex=l,He(e.slice(0,l),t)),a="\n"===e[0]||" "===e[0];var l;for(;i=r.exec(e);){var c=i[1],s=i[2];n=" "===s[0],o+=c+(a||n||""===s?"":"\n")+He(s,t),a=n}return o}(t,l),a));case 5:return'"'+function(e){for(var t,n="",i=0,r=0;r<e.length;i>=65536?r+=2:r++)i=Ye(e,r),!(t=je[i])&&De(i)?(n+=e[r],i>=65536&&(n+=e[r+1])):n+=t||Fe(i);return n}(t)+'"';default:throw new o("impossible error: invalid scalar style")}}()}function Pe(e,t){var n=Re(e)?String(t):"",i="\n"===e[e.length-1];return n+(i&&("\n"===e[e.length-2]||"\n"===e)?"+":i?"":"-")+"\n"}function We(e){return"\n"===e[e.length-1]?e.slice(0,-1):e}function He(e,t){if(""===e||" "===e[0])return e;for(var n,i,r=/ [^ ]/g,o=0,a=0,l=0,c="";n=r.exec(e);)(l=n.index)-o>t&&(i=a>o?a:l,c+="\n"+e.slice(o,i),o=i+1),a=l;return c+="\n",e.length-o>t&&a>o?c+=e.slice(o,a)+"\n"+e.slice(a+1):c+=e.slice(o),c.slice(1)}function $e(e,t,n,i){var r,o,a,l="",c=e.tag;for(r=0,o=n.length;r<o;r+=1)a=n[r],e.replacer&&(a=e.replacer.call(n,String(r),a)),(Ve(e,t+1,a,!0,!0,!1,!0)||void 0===a&&Ve(e,t+1,null,!0,!0,!1,!0))&&(i&&""===l||(l+=Le(e,t)),e.dump&&10===e.dump.charCodeAt(0)?l+="-":l+="- ",l+=e.dump);e.tag=c,e.dump=l||"[]"}function Ge(e,t,n){var i,r,a,l,c,s;for(a=0,l=(r=n?e.explicitTypes:e.implicitTypes).length;a<l;a+=1)if(((c=r[a]).instanceOf||c.predicate)&&(!c.instanceOf||"object"==typeof t&&t instanceof c.instanceOf)&&(!c.predicate||c.predicate(t))){if(n?c.multi&&c.representName?e.tag=c.representName(t):e.tag=c.tag:e.tag="?",c.represent){if(s=e.styleMap[c.tag]||c.defaultStyle,"[object Function]"===Ie.call(c.represent))i=c.represent(t,s);else{if(!Se.call(c.represent,s))throw new o("!<"+c.tag+'> tag resolver accepts not "'+s+'" style');i=c.represent[s](t,s)}e.dump=i}return!0}return!1}function Ve(e,t,n,i,r,a,l){e.tag=null,e.dump=n,Ge(e,n,!1)||Ge(e,n,!0);var c,s=Ie.call(e.dump),u=i;i&&(i=e.flowLevel<0||e.flowLevel>t);var p,f,d="[object Object]"===s||"[object Array]"===s;if(d&&(f=-1!==(p=e.duplicates.indexOf(n))),(null!==e.tag&&"?"!==e.tag||f||2!==e.indent&&t>0)&&(r=!1),f&&e.usedDuplicates[p])e.dump="*ref_"+p;else{if(d&&f&&!e.usedDuplicates[p]&&(e.usedDuplicates[p]=!0),"[object Object]"===s)i&&0!==Object.keys(e.dump).length?(!function(e,t,n,i){var r,a,l,c,s,u,p="",f=e.tag,d=Object.keys(n);if(!0===e.sortKeys)d.sort();else if("function"==typeof e.sortKeys)d.sort(e.sortKeys);else if(e.sortKeys)throw new o("sortKeys must be a boolean or a function");for(r=0,a=d.length;r<a;r+=1)u="",i&&""===p||(u+=Le(e,t)),c=n[l=d[r]],e.replacer&&(c=e.replacer.call(n,l,c)),Ve(e,t+1,l,!0,!0,!0)&&((s=null!==e.tag&&"?"!==e.tag||e.dump&&e.dump.length>1024)&&(e.dump&&10===e.dump.charCodeAt(0)?u+="?":u+="? "),u+=e.dump,s&&(u+=Le(e,t)),Ve(e,t+1,c,!0,s)&&(e.dump&&10===e.dump.charCodeAt(0)?u+=":":u+=": ",p+=u+=e.dump));e.tag=f,e.dump=p||"{}"}(e,t,e.dump,r),f&&(e.dump="&ref_"+p+e.dump)):(!function(e,t,n){var i,r,o,a,l,c="",s=e.tag,u=Object.keys(n);for(i=0,r=u.length;i<r;i+=1)l="",""!==c&&(l+=", "),e.condenseFlow&&(l+='"'),a=n[o=u[i]],e.replacer&&(a=e.replacer.call(n,o,a)),Ve(e,t,o,!1,!1)&&(e.dump.length>1024&&(l+="? "),l+=e.dump+(e.condenseFlow?'"':"")+":"+(e.condenseFlow?"":" "),Ve(e,t,a,!1,!1)&&(c+=l+=e.dump));e.tag=s,e.dump="{"+c+"}"}(e,t,e.dump),f&&(e.dump="&ref_"+p+" "+e.dump));else if("[object Array]"===s)i&&0!==e.dump.length?(e.noArrayIndent&&!l&&t>0?$e(e,t-1,e.dump,r):$e(e,t,e.dump,r),f&&(e.dump="&ref_"+p+e.dump)):(!function(e,t,n){var i,r,o,a="",l=e.tag;for(i=0,r=n.length;i<r;i+=1)o=n[i],e.replacer&&(o=e.replacer.call(n,String(i),o)),(Ve(e,t,o,!1,!1)||void 0===o&&Ve(e,t,null,!1,!1))&&(""!==a&&(a+=","+(e.condenseFlow?"":" ")),a+=e.dump);e.tag=l,e.dump="["+a+"]"}(e,t,e.dump),f&&(e.dump="&ref_"+p+" "+e.dump));else{if("[object String]"!==s){if("[object Undefined]"===s)return!1;if(e.skipInvalid)return!1;throw new o("unacceptable kind of an object to dump "+s)}"?"!==e.tag&&Ke(e,e.dump,t,a,u)}null!==e.tag&&"?"!==e.tag&&(c=encodeURI("!"===e.tag[0]?e.tag.slice(1):e.tag).replace(/!/g,"%21"),c="!"===e.tag[0]?"!"+c:"tag:yaml.org,2002:"===c.slice(0,18)?"!!"+c.slice(18):"!<"+c+">",e.dump=c+" "+e.dump)}return!0}function Ze(e,t){var n,i,r=[],o=[];for(Je(e,r,o),n=0,i=o.length;n<i;n+=1)t.duplicates.push(r[o[n]]);t.usedDuplicates=new Array(i)}function Je(e,t,n){var i,r,o;if(null!==e&&"object"==typeof e)if(-1!==(r=t.indexOf(e)))-1===n.indexOf(r)&&n.push(r);else if(t.push(e),Array.isArray(e))for(r=0,o=e.length;r<o;r+=1)Je(e[r],t,n);else for(r=0,o=(i=Object.keys(e)).length;r<o;r+=1)Je(e[i[r]],t,n)}function Qe(e,t){return function(){throw new Error("Function yaml."+e+" is removed in js-yaml 4. Use yaml."+t+" instead, which is now safe by default.")}}var ze=p,Xe=h,et=b,tt=O,nt=j,it=K,rt=xe.load,ot=xe.loadAll,at={dump:function(e,t){var n=new Ee(t=t||{});n.noRefs||Ze(e,n);var i=e;return n.replacer&&(i=n.replacer.call({"":i},"",i)),Ve(n,0,i,!0,!0)?n.dump+"\n":""}}.dump,lt=o,ct={binary:L,float:S,map:y,null:A,pairs:Y,set:B,timestamp:F,bool:v,int:C,merge:E,omap:U,seq:m,str:g},st=Qe("safeLoad","load"),ut=Qe("safeLoadAll","loadAll"),pt=Qe("safeDump","dump"),ft={Type:ze,Schema:Xe,FAILSAFE_SCHEMA:et,JSON_SCHEMA:tt,CORE_SCHEMA:nt,DEFAULT_SCHEMA:it,load:rt,loadAll:ot,dump:at,YAMLException:lt,types:ct,safeLoad:st,safeLoadAll:ut,safeDump:pt};e.CORE_SCHEMA=nt,e.DEFAULT_SCHEMA=it,e.FAILSAFE_SCHEMA=et,e.JSON_SCHEMA=tt,e.Schema=Xe,e.Type=ze,e.YAMLException=lt,e.default=ft,e.dump=at,e.load=rt,e.loadAll=ot,e.safeDump=pt,e.safeLoad=st,e.safeLoadAll=ut,e.types=ct,Object.defineProperty(e,"__esModule",{value:!0})}));

/* --- add-on logic --- */
/* Bioprint Tracker, core logic.
 *
 * An eLabNext (SciSure) add-on that reads a RASTRUM/Allegro ".rastrum" print file in the browser and
 * registers it in Inventory, giving printed plates a shared, barcoded record instead of ad hoc tracking.
 *
 * Build: edit this source, then run addon/build.sh to regenerate the uploadable addon/addon.js.
 *
 * Data model:
 *   Protocol -> an Inventory Sample of type "Bioprint Template" (a reusable print design parsed once
 *               from a .rastrum file; see showProtocolDialog).
 *   Plate    -> an Inventory Sample of type "Bioprinted Plate", one per physical plate, carrying a
 *               native eLabNext barcode and linked to its Bioprint Template (see showRunDialog /
 *               createPlates). A print run creates no Experiment; the registry lives in shared
 *               Inventory, and a user's own experiments link to these plate samples afterwards.
 * Both types must exist in the tenant (created by an admin) with the required fields. The add-on finds
 * them by name at runtime (see resolveSampleTypeID); the CONFIG IDs below are optional overrides for
 * disambiguating duplicate-named types.
 *
 * Two API notes:
 * 1. eLabSDK.API.Call is a MooTools class, not a plain function: instantiate with `new` and send the
 *    request with .execute(body) (see apiCall). Called any other way it builds the request but never
 *    sends it.
 * 2. ".rastrum" files come in three shapes, all handled by parseRastrum: one "printrun.yaml"; a split
 *    inert-base + cell-model pair of "printrun_*.yaml" files (merged by mergeExtracted); and Allegro's
 *    "printplan.yaml" (extractAllegroDoc). An unrecognised file sets result.recognized = false and the
 *    UI warns instead of saving blank fields (see showProtocolDialog).
 */

var BioprintTracker = {};

(addon => {
  'use strict';

  // ─── Tenant configuration, set these for your eLabNext (SciSure) tenant ─────
  // Shown in the UI (menu title) to confirm which build is loaded and rule out a cached copy.
  const ADDON_VERSION = '1.1.0';

  // Must match @rootVar in src/header.js. Used to find this add-on's own installed record (and from
  // it, the sdkPluginID its configuration is stored against), see getInstalledAddon.
  const ROOT_VAR = 'BioprintTracker';

  const CONFIG = {
    // Both left at 0 by default, the add-on finds each type by its exact name ("Bioprint Template" /
    // "Bioprinted Plate") in whatever tenant it runs in (see resolveSampleTypeID), so no ID is needed
    // in the normal case. Setting an ID here (or via the add-on's Configuration screen) is an OPTIONAL
    // override, only useful to disambiguate a tenant that has duplicate-named types. Do NOT hardcode a
    // tenant-specific ID as the default, an ID that means "Bioprint Template" in one tenant could mean
    // nothing, or something unrelated, in another.
    SAMPLE_TYPE_PROTOCOL: 0,
    SAMPLE_TYPE_PLATE: 0,
    // Defensive guard against a maliciously crafted (zip-bomb) file.
    MAX_RASTRUM_BYTES: 25 * 1024 * 1024,
    // Optional: keep EVERY uploaded file (protocol PDF, raw .rastrum, wellplate CSV) in one Data
    // Storage folder instead of scattering them at the storage root, by its numeric folder ID.
    // Folders are referenced by ID because the API has NO list-folders / folder-by-name endpoint
    // (confirmed by eLabNext dev support 2026-07-24), a by-name convenience was tried and dropped as
    // unreliable (it depended on the undocumented file `path` and could silently fall back to root).
    // The file-storage UI is a single-page app, so the ID is NOT in the address bar; use the finder
    // (#bioprinting-setup) or the browser Network tab to read it. Folder IDs are stable; set once.
    // Leave 0 = upload to the storage root.
    PDF_FOLDER_ID: 0
  };

  // ─── HTML escaping, every dynamic value is escaped before it touches innerHTML ─
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  // ─── API helper ──────────────────────────────────────────────────────────────
  // A hard timeout turns a silently-hanging call (never firing onSuccess or onError) into a
  // visible error instead of the UI appearing to do nothing. See the file header for why
  // eLabSDK.API.Call needs `new` + .execute() rather than being called as a plain function.
  const API_TIMEOUT_MS = 15000;

  function apiCall(method, path, body, queryParams) {
    if (typeof eLabSDK === 'undefined' || !eLabSDK.API || !eLabSDK.API.Call) {
      return Promise.reject(new Error(
        'eLabSDK is not available on this page. The add-on must run on a page where add-ons are ' +
        'active (e.g. Inventory or an Experiment), not the marketplace/detail page.'));
    }
    const callPromise = new Promise((resolve, reject) => {
      // eLabSDK.API.Call is a MooTools Class: it must be instantiated with `new`, and the
      // request is only actually sent when .execute() is called with the body. Query parameters
      // MUST go in the queryParams object, not appended to path as a string, the SDK does not
      // parse a query string inside path, it silently drops it (this was the empty-dropdown bug).
      const config = {
        method,
        path,
        onSuccess(_xhr, _status, response) { resolve(response); },
        onError(_xhr, status, response) {
          reject(new Error(`eLabNext API error (${status}): ${response || ''}`));
        }
      };
      if (queryParams) config.queryParams = queryParams;
      new eLabSDK.API.Call(config).execute(body || undefined);
    });
    const timeout = new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`${method} ${path} did not respond within ${API_TIMEOUT_MS / 1000}s (no success or error callback fired).`));
      }, API_TIMEOUT_MS);
    });
    return Promise.race([callPromise, timeout]);
  }

  // ─── Read one sample: prefer eLabSDK2 where present, else eLabSDK.API.Call ─────
  // eLabSDK2 (BETA) exposes a single-sample read (eLabSDK2.Inventory.Sample.getSampleByID); it has
  // no create or list-by-type yet, so writes and listing stay on eLabSDK.API.Call. On an Inventory
  // Browser V2 page this uses the SDK2 read; everywhere else it falls back to the SDK1 GET. It
  // normalises either result to the shape callers expect, a top-level `barcode` and a `meta` array
  // of { key, value }, and, because SDK2 is BETA and its exact return shape is not guaranteed, only
  // trusts the SDK2 result when it actually carries both, otherwise falling back to the SDK1 GET
  // (which reliably returns both with $expand=meta).
  function normaliseSample(s) {
    if (!s || typeof s !== 'object') return s;
    if (!Array.isArray(s.meta)) {
      const m = s.sampleMetas || s.metas;
      if (Array.isArray(m)) s.meta = m;
    }
    return s;
  }

  function getSampleById(sampleID) {
    const v1 = () => apiCall('GET', `samples/${sampleID}`, null, { '$expand': 'meta' });
    try {
      if (typeof eLabSDK2 !== 'undefined' && eLabSDK2.Inventory && eLabSDK2.Inventory.Sample &&
        typeof eLabSDK2.Inventory.Sample.getSampleByID === 'function') {
        return Promise.resolve()
          // Request meta explicitly: SDK2 returns the meta array only with the expand filter (the
          // same reason V1 needs $expand=meta). Without it the guard below never sees a meta array,
          // so it always falls back and the SDK2 path is dead weight. The guard still falls back on
          // any unexpected shape, so asking for meta can only help.
          .then(() => eLabSDK2.Inventory.Sample.getSampleByID(sampleID, { expand: ['meta'] }))
          .then(s => {
            const n = normaliseSample(s);
            if (n && Array.isArray(n.meta) && ('barcode' in n)) return n;
            return v1();
          })
          .catch(() => v1());
      }
    } catch (e) { /* fall through to the SDK1 GET */ }
    return v1();
  }

  // Resolves a sample type ID: uses the configured numeric ID if set (fast, unambiguous, no extra
  // call, the normal case once an environment is configured), and only if it's unset (0) falls
  // back to looking up a type by exact name. The fallback fails LOUD, never guesses, on the two
  // ways that can go wrong: no type with that name, or more than one, duplicate-name collisions
  // are a real, observed failure mode in eLabNext tenants, not just a hypothetical to guard against.
  const resolvedTypeIdCache = {};
  function resolveSampleTypeID(configuredID, expectedName) {
    if (configuredID) return Promise.resolve(configuredID);
    if (resolvedTypeIdCache[expectedName]) return Promise.resolve(resolvedTypeIdCache[expectedName]);
    return apiCall('GET', 'sampleTypes').then(resp => {
      let list = resp;
      if (resp && Array.isArray(resp.data)) list = resp.data;
      else if (resp && Array.isArray(resp.items)) list = resp.items;
      else if (resp && Array.isArray(resp.results)) list = resp.results;
      if (!Array.isArray(list)) {
        throw new Error(`Could not read the tenant's sample types to find "${expectedName}".`);
      }
      const matches = list.filter(t => String(t.name || '').trim().toLowerCase() === expectedName.toLowerCase());
      if (matches.length === 0) {
        // Name matching is exact (case/edge-whitespace aside), so the usual cause is a typo or a
        // pluralised name. We already have the full list here, so point at the near-misses instead of
        // a dead end: normalise both sides (strip case and every non-alphanumeric) and surface any
        // existing name that equals or contains/overlaps the wanted one, e.g. "Bioprint Templates".
        const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const wanted = normalize(expectedName);
        const near = list.map(t => String(t.name || '')).filter(n => {
          const x = normalize(n);
          return x && (x === wanted || x.indexOf(wanted) !== -1 || wanted.indexOf(x) !== -1);
        });
        const hint = near.length
          ? ` The closest existing name${near.length > 1 ? 's are' : ' is'} "${near.join('", "')}" — most likely one of these just needs renaming to exactly "${expectedName}".`
          : '';
        throw new Error(`This tenant is not set up for Bioprint Tracker yet: no sample type named "${expectedName}" exists.${hint} Ask your eLab administrator to create it (or rename the existing one) in Inventory settings, with that exact name and the required fields.`);
      }
      if (matches.length > 1) {
        throw new Error(`There is more than one sample type named "${expectedName}" in this tenant, so the add-on cannot tell which to use. Ask your eLab administrator to rename them so only one is called exactly "${expectedName}".`);
      }
      const id = matches[0].sampleTypeID != null ? matches[0].sampleTypeID : matches[0].id;
      resolvedTypeIdCache[expectedName] = id;
      return id;
    });
  }

  // ─── One-time tenant setup: create the two sample types + their fields (admin-only) ──
  // DRAFTED 2026-07-24 on eLabNext dev support's confirmation that sample-type mutations use the
  // `/sampleTypes` endpoints (POST /sampleTypes, then POST /sampleTypes/{id}/meta per field). This
  // removes the manual admin step of hand-building the two types. It is NOT wired into the everyday
  // create path, it runs only when an admin explicitly triggers addon.setupSampleTypes() (see the
  // #bioprinting-setup-types entry). ADMIN CHECK: there is NO client-side role API, the assumed
  // `eLabSDK.User.getUserRole()` does not exist on the tenant (confirmed 2026-07-24, threw
  // "not a function"). So we do NOT pre-check the role; instead we attempt creation and let the
  // server decide, creating a sample type is server-enforced admin-only, returning 403 Forbidden for
  // a non-admin (documented). A 403 is turned into a clear "needs an admin account" message (see
  // isForbidden / setupSampleTypes). VERIFIED WORKING on the tenant (2026-07-24): an admin run created
  // Bioprint Template (20 fields) and Bioprinted Plate (13 fields), so POST /sampleTypes returns a usable
  // ID and the per-field POSTs behave as documented.
  //
  // This declarative list is the single source of truth for what a correctly-configured tenant looks
  // like. KEEP IT IN SYNC with the metaField/metaFile/metaLink calls in the two create flows
  // (showProtocolDialog's `metas` and buildRunPlateSpecs), same key spelling, same sampleDataType.
  const REQUIRED_SAMPLE_TYPE_FIELDS = {
    'Bioprint Template': [
      { key: 'Printer version', type: 'TEXT' },
      { key: 'Print model', type: 'TEXT' },
      { key: 'Matrix code', type: 'TEXT' },
      { key: 'Cell line', type: 'TEXT' },
      { key: 'Cell concentration (cells/mL)', type: 'TEXT' },
      { key: 'Wellplate', type: 'TEXT' },
      { key: 'Bioink', type: 'TEXT' },
      { key: 'Activator', type: 'TEXT' },
      { key: 'Inert base bioink', type: 'TEXT' },
      { key: 'Inert base activator', type: 'TEXT' },
      { key: 'Bioink pressure (kPa)', type: 'NUMERIC' },
      { key: 'Bioink open time (us)', type: 'NUMERIC' },
      { key: 'Activator pressure (kPa)', type: 'NUMERIC' },
      { key: 'Activator open time (us)', type: 'NUMERIC' },
      { key: 'RASTRUM schema version', type: 'TEXT' },
      { key: 'Source file hash', type: 'TEXT' },
      { key: 'Protocol PDF', type: 'FILE' },
      { key: 'Wellplate summary (CSV)', type: 'FILE' },
      { key: 'Designed plates (JSON)', type: 'TEXT' },
      { key: 'Print file', type: 'FILE' }
    ],
    'Bioprinted Plate': [
      { key: 'Bioprint Template', type: 'SAMPLELINK' },
      { key: 'Cell line', type: 'TEXT' },
      { key: 'Cell concentration (cells/mL)', type: 'TEXT' },
      { key: 'Printer', type: 'TEXT' },
      { key: 'Print date', type: 'DATE' },
      { key: 'Print run ID', type: 'TEXT' },
      { key: 'Bioink lot', type: 'TEXT' },
      { key: 'Activator lot', type: 'TEXT' },
      { key: 'Matrix code', type: 'TEXT' },
      { key: 'Wellplate', type: 'TEXT' },
      { key: 'Passage number', type: 'TEXT' },
      { key: 'Plate', type: 'TEXT' },
      { key: 'Inert base print date', type: 'DATE' }
    ]
  };

  // Does an API error look like a permission denial? apiCall formats errors as
  // "eLabNext API error (<status>): ...", so a 403 (or a 401) means the account lacks permission -
  // for sample-type creation that means "not an admin". Used to turn the server's own enforcement
  // into a clear message instead of a raw error.
  function isForbidden(err) {
    return /\((?:401|403)\)/.test(String((err && err.message) || err || ''));
  }

  // One-line descriptions set on each type at creation, so a user browsing Inventory can tell the two
  // apart and see how they relate. This is the main defence against template/plate confusion. (Colours
  // would help too, but the accepted colour-value format is undocumented, see docs/.record/future-ideas.md.)
  const REQUIRED_SAMPLE_TYPE_DESCRIPTIONS = {
    'Bioprint Template': 'The reusable print protocol imported from a .rastrum file. Each print run creates Bioprinted Plate records linked to one of these.',
    'Bioprinted Plate': 'One physical printed plate, barcoded, linked back to its Bioprint Template.'
  };

  // Create one sample type and add its fields. POST /sampleTypes returns the new sampleTypeID; fields
  // are added sequentially (POST /sampleTypes/{id}/meta) so a failure names the field that broke.
  // `description` (optional) is set on the type so browsing users can tell the two types apart.
  function createSampleTypeWithFields(name, fields, description) {
    return apiCall('POST', 'sampleTypes', description ? { name, description } : { name }).then(resp => {
      const typeID = (resp && resp.sampleTypeID != null) ? resp.sampleTypeID :
        (resp && resp.data != null ? resp.data : resp);
      if (typeID == null || typeID === '') {
        throw new Error(`Sample type "${name}" was created but no ID came back.`);
      }
      return addFieldsToType(typeID, fields).then(() => ({
        name,
        typeID,
        fieldCount: (fields || []).length
      }));
    });
  }

  // Add fields to an existing sample type, one at a time (POST /sampleTypes/{id}/meta) so a failure
  // names the field that broke. Adding a field is non-destructive: it never touches existing fields or
  // data. Used both when creating a type and when topping up a type that is missing fields.
  function addFieldsToType(typeID, fields) {
    let chain = Promise.resolve();
    (fields || []).forEach(f => {
      chain = chain.then(() => apiCall('POST', `sampleTypes/${typeID}/meta`,
        { key: f.key, sampleDataType: f.type }));
    });
    return chain;
  }

  // eLabNext's own words for a field's data type, for plain-language messages (the raw API values are
  // ALL-CAPS codes like NUMERIC/SAMPLELINK that mean nothing to a user).
  function prettyType(t) {
    const m = { TEXT: 'Text', TEXTAREA: 'Text area', NUMERIC: 'Number', DATE: 'Date',
      DATETIME: 'Date & time', FILE: 'File', SAMPLELINK: 'Sample link', PROJECT: 'Project',
      CHEMICAL: 'Chemical', COMBO: 'Dropdown', RADIO: 'Single choice', CHECKBOX: 'Checkboxes' };
    return m[String(t == null ? '' : t).toUpperCase()] || String(t == null ? '' : t);
  }
  // Read-only: compare a sample type's LIVE fields (a key→{sampleDataType} map from
  // getSampleTypeMetaMap) against the fields we require, and report what is missing or the wrong type.
  // Returns {readFailed:true} if the map could not be read (so "can't check" isn't mistaken for "all
  // missing"), else {missing:[keys], mismatched:[{key,expected,got}], ok:<count of correct fields>}.
  function checkTypeFields(map, requiredFields) {
    if (!map) return { readFailed: true };
    const missing = [], mismatched = [];
    (requiredFields || []).forEach(f => {
      const hit = map[String(f.key == null ? '' : f.key).trim().toLowerCase()];
      if (!hit) { missing.push(f.key); return; }
      if (hit.sampleDataType && f.type &&
          String(hit.sampleDataType).toUpperCase() !== String(f.type).toUpperCase()) {
        mismatched.push({ key: f.key, expected: f.type, got: hit.sampleDataType });
      }
    });
    return { missing, mismatched,
      ok: (requiredFields || []).length - missing.length - mismatched.length };
  }

  function metaField(key, type, value) {
    return { key, sampleDataType: type, value: value == null ? '' : String(value) };
  }
  function metaLink(key, sampleID) {
    return { key, sampleDataType: 'SAMPLELINK', sampleIDs: [sampleID] };
  }
  // The docs only confirm the READ shape for a FILE field (`files: [{fileID, name, realName}]`);
  // the write/create shape is unconfirmed and may differ, as is common for REST APIs (write often
  // takes bare IDs where read returns full objects). Sending both a `files` object array and a
  // flat `fileIDs` array is a cheap hedge, an unrecognised key is normally just ignored, until
  // the real write shape is confirmed via the tenant's own API reference.
  function metaFile(key, fileID) {
    return { key, sampleDataType: 'FILE', files: [{ fileID }], fileIDs: [fileID] };
  }

  // ─── Stable meta-field IDs (sampleTypeMetaID), robust writes ─────────────────
  // eLabNext dev support (2026-07-24) confirmed the recommended write flow: read each field's stable
  // sampleTypeMetaID from GET /sampleTypes/{id}/meta, then send it on the sample's meta so the value
  // matches by ID, not by display name. Two benefits over the by-name path: it survives a field being
  // renamed, and per the createSampleMeta docs a value written WITHOUT a sampleTypeMetaID is "not
  // searchable". The write schema (SampleMetaNew) does NOT list sampleTypeMetaID, but dev support said
  // the doc rendering is wrong and the server honours it, and an unrecognised key is ignored anyway,
  // so sending it is safe. This stays OPPORTUNISTIC: if the map can't be read, or a key isn't in it,
  // the entry is left exactly as before (by-name), and the $expand=meta read-back guard still catches a
  // genuine mismatch. VERIFY on the tenant that ID-matched values actually persist.
  const sampleTypeMetaMapCache = {};
  function getSampleTypeMetaMap(typeID, force) {
    if (!typeID) return Promise.resolve(null);
    // `force` re-reads from the server (used after setup adds fields, so the cached map isn't stale).
    if (!force && sampleTypeMetaMapCache[typeID]) return Promise.resolve(sampleTypeMetaMapCache[typeID]);
    // $records: 1000 because list endpoints paginate at 10 by default, a type has more fields than
    // that, so without it the tail of the field list (hence its IDs) would silently be missing.
    return apiCall('GET', `sampleTypes/${typeID}/meta`, null, { '$records': 1000 })
      .then(resp => {
        const list = (resp && Array.isArray(resp.data)) ? resp.data : (Array.isArray(resp) ? resp : []);
        // Prototype-less map: field names come from tenant field definitions and are used as keys, so
        // a field literally named "__proto__" can't reassign this map's prototype (defensive; low risk).
        const map = Object.create(null);
        list.forEach(d => {
          if (d && d.key != null && d.sampleTypeMetaID != null) {
            map[String(d.key).trim().toLowerCase()] =
              { sampleTypeMetaID: d.sampleTypeMetaID, sampleDataType: d.sampleDataType };
          }
        });
        sampleTypeMetaMapCache[typeID] = map;
        return map;
      })
      .catch(() => null); // fall back to by-name writes
  }
  // Tag each meta entry with its field's sampleTypeMetaID where the key matches (case/whitespace
  // insensitive). Non-destructive: entries with no match, or when map is null, are left untouched.
  function stampMetaIDs(metas, map) {
    if (!map || !metas) return metas;
    metas.forEach(m => {
      if (!m || m.sampleTypeMetaID != null) return;
      const hit = map[String(m.key == null ? '' : m.key).trim().toLowerCase()];
      if (hit && hit.sampleTypeMetaID != null) m.sampleTypeMetaID = hit.sampleTypeMetaID;
    });
    return metas;
  }

  // Uploads a file and returns its fileID, for use in a FILE-type sampleMetas entry (see metaFile).
  // MIME type comes from the file extension. The eLabNext file-upload docs require a Content-Type
  // header matching the file. Without it the stored file is a generic blob that will not open as a
  // PDF or CSV. The body must be RAW BINARY. Converting it to a string first silently corrupts it.
  function contentTypeFor(fileName) {
    const n = String(fileName).toLowerCase();
    if (n.slice(-4) === '.pdf') return 'application/pdf';
    if (n.slice(-4) === '.csv') return 'text/csv';
    if (n.slice(-4) === '.svg') return 'image/svg+xml';
    if (n.slice(-4) === '.png') return 'image/png';
    return 'application/octet-stream';
  }
  // POST /api/v1/files takes the file as a RAW BINARY body (not JSON, not multipart), a shape
  // eLabSDK.API.Call isn't built for, so this goes through fetch() on the same session instead.
  // Best-effort: callers should treat a rejection here as "attach the file failed", not as a
  // reason to abort the whole save, the record is still valid without the attachment.
  // Waits for the stored configuration before uploading, so an upload started right after page load
  // still gets the configured folder. Folder placement is set at upload and cannot be changed later
  // (there is no move endpoint), so losing this race would strand the file at the storage root.
  function uploadFile(fileName, arrayBuffer) {
    return configReady.then(() => uploadFileNow(fileName, arrayBuffer));
  }

  function uploadFileNow(fileName, arrayBuffer) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    const url = `/api/v1/files?fileName=${encodeURIComponent(fileName)}${CONFIG.PDF_FOLDER_ID ? `&folderID=${encodeURIComponent(CONFIG.PDF_FOLDER_ID)}` : ''}`;
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': contentTypeFor(fileName), 'X-Requested-With': 'XMLHttpRequest' },
      body: arrayBuffer,
      signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File upload failed (${resp.status})`);
      return resp.json();
    }).then(json => {
      if (!json || json.fileID == null) throw new Error('File upload response had no fileID');
      return json.fileID;
    }).catch(err => {
      clearTimeout(timeout);
      throw err;
    });
  }

  // Download a file's raw bytes by fileID (the reverse of uploadFile; plain fetch, session-cookie
  // auth, same shape the round-trip check confirmed). Returns the ArrayBuffer, e.g. to re-parse a
  // .rastrum attached to a protocol.
  function fetchFileBytes(fileID) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    return fetch(`/api/v1/files/${encodeURIComponent(fileID)}`, {
      method: 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File download failed (${resp.status})`);
      return resp.arrayBuffer();
    }).catch(err => { clearTimeout(timeout); throw err; });
  }

  // List files in the group (GET /api/v1/files), same session-cookie fetch as the up/download calls.
  // Used only by the folder-ID finder (a setup helper): the response carries each file's `folderID`
  // and `path`, which is the ONLY way to surface a Data Storage folder's ID, the API has no
  // list-folders endpoint. Handles both a bare array and a {data:[...]} paged envelope.
  function listFiles() {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, API_TIMEOUT_MS);
    return fetch('/api/v1/files', {
      method: 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
    }).then(resp => {
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`File list failed (${resp.status})`);
      return resp.json();
    }).then(json => Array.isArray(json) ? json : ((json && (json.data || json.files)) || [])).catch(err => { clearTimeout(timeout); throw err; });
  }

  // ─── The add-on's own stored configuration ────────────────────────────────────
  // The Developer Platform's Configure dialog is only ONE route into this store. The same values are
  // readable and writable over the API, and nothing stops the add-on using that route on itself:
  //   GET  /api/v1/addons/{sdkPluginID}/configuration   read  (returns the stored JSON as a STRING)
  //   PUT  /api/v1/addons/configuration                 write ({configuration, sdkPluginID, scope})
  // This matters because the Configure dialog rendered EMPTY in a production tenant while rendering
  // correctly in the sandbox (2026-07-31), leaving no way to set the file folder. Writing the value
  // from inside the add-on removes that dependency: setup finishes in the folder finder itself.
  // It is not a way around permissions. Both routes write the same value under the same rules, so a
  // user who may not edit the install's configuration gets a 403 here too, just with a clear message.
  const CONFIG_SCOPES = ['USER', 'GROUP', 'INSTITUTE', 'SYSTEM'];

  // This add-on's installed record, which is the only source of the sdkPluginID its configuration is
  // keyed by. Cached on success only: a failure (e.g. side-loaded, so there is no installed record)
  // must stay retryable rather than poisoning every later call.
  let installedAddonPromise = null;
  function getInstalledAddon() {
    if (installedAddonPromise) return installedAddonPromise;
    const p = apiCall('GET', 'addons/installed', null, { rootVar: ROOT_VAR, '$records': 100 })
      .then(resp => {
        const list = (resp && Array.isArray(resp.data)) ? resp.data : (Array.isArray(resp) ? resp : []);
        const mine = list.filter(a => a && String(a.rootVar || '').trim() === ROOT_VAR);
        if (!mine.length) {
          throw new Error(
            'This add-on does not appear as installed in this environment, so its settings cannot be ' +
            'saved from here. That is expected while side-loading. Note the folder number and set it ' +
            'in the add-on’s Configure screen instead.');
        }
        // An add-on can be installed at more than one scope; prefer an active record over an inactive
        // one, otherwise keep the order the API returned.
        const active = mine.filter(a => a.active !== false);
        return (active.length ? active : mine)[0];
      });
    p.catch(() => { installedAddonPromise = null; });
    installedAddonPromise = p;
    return p;
  }

  // The stored configuration comes back as a JSON STRING, per the reference. Tolerate the shapes a
  // gateway might hand back instead (an already-parsed object, or one wrapped in a {configuration}
  // envelope) rather than assuming one and failing opaquely. Anything unreadable means "nothing
  // configured", never a thrown error, since a missing configuration is a normal first-run state.
  function normaliseStoredConfig(raw) {
    if (raw == null || raw === '') return {};
    if (typeof raw === 'object') {
      if (raw.configuration != null) return normaliseStoredConfig(raw.configuration);
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function readStoredConfig() {
    return getInstalledAddon().then(a =>
      apiCall('GET', `addons/${encodeURIComponent(a.sdkPluginID)}/configuration`)
        .then(normaliseStoredConfig));
  }

  // Merge `patch` into whatever is already stored and write the whole object back. The endpoint
  // replaces the configuration wholesale, so writing only the changed key would silently discard
  // every other setting. A read that fails is treated as "nothing stored yet" so a first write can
  // still succeed; a read that succeeds is preserved in full.
  function saveStoredConfig(patch) {
    return getInstalledAddon().then(a => {
      const declared = String(a.scope || '').toUpperCase();
      // Write at the scope the add-on is installed at, so the value is read back by the same
      // resolution that served it. Fall back to GROUP (this add-on's sample types are per-group, so
      // that is the level its settings belong to) if the record carries no usable scope.
      const scope = CONFIG_SCOPES.indexOf(declared) !== -1 ? declared : 'GROUP';
      return apiCall('GET', `addons/${encodeURIComponent(a.sdkPluginID)}/configuration`)
        .then(normaliseStoredConfig, () => ({}))
        .then(current => {
          const merged = Object.assign({}, current, patch);
          return apiCall('PUT', 'addons/configuration', {
            configuration: JSON.stringify(merged),
            sdkPluginID: a.sdkPluginID,
            scope
          }).then(() => merged);
        });
    });
  }

  // Apply a configuration object (from either route) onto the live CONFIG block.
  function applyConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    if (cfg.sampleTypeProtocol) CONFIG.SAMPLE_TYPE_PROTOCOL = cfg.sampleTypeProtocol;
    if (cfg.sampleTypePlate) CONFIG.SAMPLE_TYPE_PLATE = cfg.sampleTypePlate;
    // Explicit 0 / '' is meaningful here: it means "the main file area", so only an absent value is
    // ignored. A non-numeric value is treated as unset rather than silently becoming NaN.
    if (cfg.pdfFolderID != null && cfg.pdfFolderID !== '') {
      CONFIG.PDF_FOLDER_ID = Number(cfg.pdfFolderID) || 0;
    }
  }

  // Resolves once the stored configuration has been applied (or has failed, which is not fatal).
  // uploadFile waits on it so a file uploaded moments after page load still lands in the configured
  // folder rather than at the storage root. Placement cannot be corrected afterwards: the API has no
  // move endpoint and folderID is only accepted at upload, so a race here is a permanent mistake.
  let configReady = Promise.resolve();

  // ─── .rastrum parser, runs entirely in the browser (JSZip + js-yaml are inlined) ─
  function sha256Hex(buf) {
    return crypto.subtle.digest('SHA-256', buf).then(h => Array.prototype.map.call(new Uint8Array(h), b => (`0${b.toString(16)}`).slice(-2)).join(''));
  }

  // RASTRUM classic/v2 schema (PascalCase: PrintJobParams/PrintFluids/PrimingGroup/...).
  // Works whether the run's inert base was printed combined (one printrun.yaml) or separately
  // (printrun_cell_model_only.yaml + printrun_inert_base_only.yaml), each file only has the
  // fields for its own phase; mergeExtracted() below combines them.
  function extractRastrumDoc(data) {
    const params = data.PrintJobParams || {};
    const fluids = {};
    (params.PrintFluids || []).forEach(f => { fluids[f.Fluid] = f; });
    const vals = Object.keys(fluids).map(k => fluids[k]);
    const byGroup = g => vals.filter(f => f.PrimingGroup === g);
    const cellFluid = byGroup('Cells')[0];
    const bioinkFluid = byGroup('Bioinks')[0];
    const inert = byGroup('Inert Base');
    const activatorList = inert.filter(f => f.CleaningFluidType === 'CellFluid');
    const bioinkBaseList = inert.filter(f => f.CleaningFluidType === 'NormalFluid');
    const activator = activatorList[0];
    const bioinkBase = bioinkBaseList[0];
    // A run can use several cell/bioink fluids (e.g. one plate, several cell lines). Show the DISTINCT
    // set, not just the first. Join with ' · ' because classic fluid NAMES embed commas
    // ("F176 - Cell A, 2,000,000/mL"), which a comma separator would collide with.
    function distinctFluids(list) {
      const out = [];
      (list || []).forEach(f => { const n = f && f.Fluid; if (n && out.indexOf(n) === -1) out.push(n); });
      return out.join(' · ');
    }

    const maps = params.PrintWellModelMaps || [];
    const cellMap = maps.filter(m => {
      if (!cellFluid) return false;
      const mc = m.MaterialsConfig || {};
      return Object.keys(mc).some(k => (mc[k] || []).some(mat => mat.Name === cellFluid.Fluid));
    })[0];

    const wc = params.WellplateConfigs || {};
    let wellplate = wc.Default || wc.WP011;
    if (!wellplate) {
      const k = Object.keys(wc).filter(x => x !== 'Target Plate')[0];
      wellplate = (k && wc[k]) || null;
    }

    const variantGroups = {};
    (params.PrintingParameterVariantGroups || []).forEach(g => { variantGroups[g.Name] = g; });
    function printParams(fluidName) {
      if (!fluidName) return {};
      for (let i = 0; i < maps.length; i++) {
        const mc = maps[i].MaterialsConfig || {};
        const keys = Object.keys(mc);
        for (let j = 0; j < keys.length; j++) {
          const mats = mc[keys[j]] || [];
          for (let m = 0; m < mats.length; m++) {
            if (mats[m].Name === fluidName) {
              const g = variantGroups[mats[m].PrintingParameterVariantGroupName] || {};
              return (g.Variants || [])[0] || {};
            }
          }
        }
      }
      return {};
    }

    // The classic schema doesn't give a product name/catalog number, but it does give the
    // manufacturer and well count, which is enough to tell plates apart at a glance.
    let wellplateDescription = '';
    if (wellplate && wellplate.RowCount && wellplate.ColCount) {
      wellplateDescription = `${(wellplate.Make ? `${String(wellplate.Make).trim()} ` : '') +
  (wellplate.RowCount * wellplate.ColCount)}-well`;
    }

    // Classic files embed the cell line and concentration inside the cell fluid's NAME, e.g.
    // "F176 - Cell A, 2,000,000/mL". Pull them out. This format carries no matrix (Px) code, so
    // matrix_codes stays empty here rather than being invented (confirmed against real files).
    let cellLine = '', cellConc = '';
    if (cellFluid && cellFluid.Fluid) {
      const mCell = String(cellFluid.Fluid).match(/-\s*(.+?),\s*([\d,]+)\s*\/\s*mL/i);
      if (mCell) { cellLine = mCell[1].trim(); cellConc = mCell[2].replace(/,/g, ''); }
    }

    return {
      print_model: (cellMap && cellMap.PrintWellModelName) || '',
      wellplate: (wellplate && wellplate.Name) || '',
      wellplate_description: wellplateDescription,
      wellplate_display: wellplateDescription || (wellplate && wellplate.Name) || '',
      cell_line: cellLine,
      cell_concentration: cellConc,
      matrix_codes: '',
      fluid_bioink: distinctFluids(byGroup('Bioinks')) || (bioinkFluid && bioinkFluid.Fluid) || '',
      fluid_cell: distinctFluids(byGroup('Cells')) || (cellFluid && cellFluid.Fluid) || '',
      fluid_activator: distinctFluids(activatorList) || (activator && activator.Fluid) || '',
      fluid_bioink_base: distinctFluids(bioinkBaseList) || (bioinkBase && bioinkBase.Fluid) || '',
      pp_bioink: printParams(bioinkFluid && bioinkFluid.Fluid),
      pp_cell: printParams(cellFluid && cellFluid.Fluid)
    };
  }

  // Allegro schema (snake_case: outcomes/resources/matrix_conditions_by_ref_code/...). Structurally
  // different from RASTRUM: cells are embedded (CellContents) on whichever fluid carries them,
  // rather than being their own fluid entry, and print pressure/time are resolved via the model's
  // NominalDropVolumeByFluidSlot + the fluid's PrintingParameterGroupNameBase.
  // Human wellplate name for an Allegro plate code, from the file's own catalog (manufacturer +
  // description + catalog number). Shared by the protocol summary and the per-plate designed-plate list.
  function allegroPlateName(resources, code) {
    const cat = ((resources || {}).compatible_wellplates || {})[code] || {};
    const make = String(cat.make || '').trim();
    const desc = String(cat.description || cat.model || '').trim();
    // The catalog description sometimes already starts with the manufacturer name; don't repeat it.
    const name = (desc && make && desc.toLowerCase().indexOf(make.toLowerCase()) === 0)
      ? desc : [make, desc].filter(Boolean).join(' ');
    return [name, cat.catalog_num ? `(#${cat.catalog_num})` : ''].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function extractAllegroDoc(data) {
    const outcomes = data.outcomes || {};
    const resources = data.resources || {};
    const models = outcomes.model_configuration_by_model_name || {};
    const modelList = Object.keys(models).map(k => models[k]);
    // Prefer the model with an architecture name set (the actual print model, not the plain
    // inert-base template that has none).
    const printModel = modelList.filter(m => m.ModelArchitectureName)[0] || modelList[0] || {};

    const wellplateEntry = (outcomes.wellplates || [])[0] || {};
    const matrixConds = outcomes.matrix_conditions_by_ref_code || {};
    const compartmentRefs = printModel.MatrixConditionRefsByCompartment || {};
    const defaultRef = compartmentRefs.Default ||
      Object.keys(compartmentRefs).map(k => compartmentRefs[k])[0];
    const cond = matrixConds[defaultRef] || {};

    const inertCond = matrixConds[wellplateEntry.inert_base_matrix_condition_ref] || {};

    const templates = resources.model_templates_by_code || {};
    const nominalVol = (templates[printModel.ModelTemplateCode] || {}).NominalDropVolumeByFluidSlot || {};
    const variantGroups = {};
    (resources.printing_parameter_variant_groups || []).forEach(g => { variantGroups[g.name] = g; });
    const fluidSpecs = resources.fluid_specs_by_name || {};

    function fcode(c, slot) { return c && c[slot] ? c[slot].FCode : ''; }
    function paramsFor(code, slot) {
      const spec = code && fluidSpecs[code];
      const vol = nominalVol[slot];
      if (!spec || !spec.PrintingParameterGroupNameBase || vol == null) return {};
      const group = variantGroups[`${spec.PrintingParameterGroupNameBase}-${vol}nl`];
      const v = group && group.variants && group.variants[0];
      return v ? { Pressure: v.printing_pressure, OpenTime: v.printing_open_time, OpenTimeUnits: 'us' } : {};
    }

    const bioinkCode = fcode(cond, 'BioinkFluid');
    const cellCode = fcode(cond, 'ActivatorFluid'); // in this schema, cells ride on the activator fluid

    // Allegro's resources list a full catalog entry per plate code. Build a CONCISE human name per
    // DISTINCT plate, a run can print onto more than one plate type, dropping the long marketing
    // suffix after the first comma/parenthesis so the overview stays readable. (The per-plate wizard
    // names each plate separately via allegroPlateName in buildDesignedPlates.)
    const catalogs = resources.compatible_wellplates || {};
    function plateNameFor(code) {
      const pc = catalogs[code] || {};
      const make = String(pc.make || '').trim();
      const desc = String(pc.description || pc.model || '').trim().split(/\s*[,(]/)[0].trim();
      const nm = (desc && make && desc.toLowerCase().indexOf(make.toLowerCase()) === 0)
        ? desc : [make, desc].filter(Boolean).join(' ');
      return [nm, pc.catalog_num ? `(#${pc.catalog_num})` : '']
        .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    const plateCodes = [];
    (outcomes.wellplates || []).forEach(w => {
      const c = w.wellplate_model_code;
      if (c && plateCodes.indexOf(c) === -1) plateCodes.push(c);
    });
    if (!plateCodes.length && wellplateEntry.wellplate_model_code) plateCodes.push(wellplateEntry.wellplate_model_code);
    const wellplateCode = plateCodes.join(', ');
    const wellplateDescription = plateCodes.map(plateNameFor).filter(Boolean).join('  ·  ');

    // Cell lines, concentrations, matrix (Px) codes AND fluids come from the matrix conditions. A
    // multi-matrix model has several conditions, each with its own bioink/activator fluid, so collect
    // the DISTINCT set of each, not just the default condition's (the earlier single-value bug). Cell
    // conditions (those carrying cells) feed the cell fluids; conditions with no cells are the inert
    // base and feed the inert fluids.
    function addTo(arr, v) { if (v && arr.indexOf(v) === -1) arr.push(v); }
    const cellNames = [], cellConcs = [], cellMatrixCodes = [];
    const bioinkCodes = [], cellFluidCodes = [], inertBioinkCodes = [], inertActivatorCodes = [];
    Object.keys(matrixConds).forEach(ref => {
      const c = matrixConds[ref] || {};
      const contents = (c.ActivatorFluid && c.ActivatorFluid.CellContents) || [];
      if (contents && contents.length) {
        addTo(cellMatrixCodes, c.MatrixCode);
        contents.forEach(cc => {
          addTo(cellNames, cc.CellName);
          if (cc.CellsPerMl != null) addTo(cellConcs, cc.CellsPerMl);
        });
        addTo(bioinkCodes, fcode(c, 'BioinkFluid'));
        addTo(cellFluidCodes, fcode(c, 'ActivatorFluid'));
      } else {
        addTo(inertBioinkCodes, fcode(c, 'BioinkFluid'));
        addTo(inertActivatorCodes, fcode(c, 'ActivatorFluid'));
      }
    });

    return {
      print_model: printModel.ModelName || '',
      wellplate: wellplateCode,
      wellplate_description: wellplateDescription,
      wellplate_display: wellplateDescription || wellplateCode,
      cell_line: cellNames.join(', '),
      cell_concentration: cellConcs.join(', '),
      matrix_codes: cellMatrixCodes.join(', '),
      // Distinct fluid set across all matrix conditions (fall back to the default condition's if the
      // per-condition scan somehow found none), so a multi-matrix model lists every bioink/activator.
      fluid_bioink: bioinkCodes.join(', ') || bioinkCode,
      fluid_cell: cellFluidCodes.join(', ') || cellCode,
      fluid_activator: inertActivatorCodes.join(', ') || fcode(inertCond, 'ActivatorFluid'),
      fluid_bioink_base: inertBioinkCodes.join(', ') || fcode(inertCond, 'BioinkFluid'),
      pp_bioink: paramsFor(bioinkCode, 'bioink'),
      pp_cell: paramsFor(cellCode, 'activator')
    };
  }

  // Full well-by-well summary for Allegro files (outcomes.platemaps_by_plate maps well ranges to a
  // model + "variant" name; a plate can use more than one model, e.g. an imaging model on some
  // wells and a multi-compartment "triple matrix" model on others). extractAllegroDoc() above only
  // reports the FIRST model, this covers every well range on every model.
  //
  // Verified against a real multi-model file with three compartments (Left/Middle/Right): variant
  // names don't always match a compartment key directly (e.g. "Left_3DControl" for compartment
  // "Left"), so resolution tries, in order: (1) an exact match, (2) the compartment whose key the
  // variant name starts with (grounded in the model template's own declared variant list, e.g.
  // "ThreeDControlVariants: [Left_3DControl, ...]"), (3) if the model has only one compartment, that
  // one regardless of the variant's name, (4) if the variant is literally "Default" and the model
  // has more than one compartment, ALL of them combined (a well can genuinely contain more than one
  // matrix, that's what a "triple matrix" well is). Anything else is reported as unresolved rather
  // than guessed.
  function resolveMatrixRefsForVariant(compartmentRefs, variantName) {
    const keys = Object.keys(compartmentRefs);
    if (compartmentRefs[variantName] != null) {
      return { refs: [compartmentRefs[variantName]], resolvedVia: 'exact' };
    }
    const prefixMatches = keys.filter(k => variantName.indexOf(k) === 0)
      .sort((a, b) => b.length - a.length);
    if (prefixMatches.length) {
      return { refs: [compartmentRefs[prefixMatches[0]]], resolvedVia: `prefix match (${prefixMatches[0]})` };
    }
    if (keys.length === 1) {
      return { refs: [compartmentRefs[keys[0]]], resolvedVia: `only compartment (${keys[0]})` };
    }
    if (variantName === 'Default' && keys.length > 1) {
      return { refs: keys.map(k => compartmentRefs[k]),
        resolvedVia: `all compartments (${keys.join('+')})` };
    }
    return { refs: [], resolvedVia: 'UNRESOLVED' };
  }

  function buildAllegroWellplateRows(data) {
    const outcomes = data.outcomes || {};
    const models = outcomes.model_configuration_by_model_name || {};
    const matrixConds = outcomes.matrix_conditions_by_ref_code || {};
    const platemaps = outcomes.platemaps_by_plate || {};
    function codeFor(ref) { const c = matrixConds[ref] || {}; return c.MatrixCode || ref; }
    // Each cell carries its own concentration (CellsPerMl), so keep them paired, a plate can hold
    // more than one cell line at more than one concentration.
    function cellPairsFor(ref) {
      const cc = ((matrixConds[ref] || {}).ActivatorFluid || {}).CellContents || [];
      return cc.filter(x => x.CellName)
        .map(x => ({
        name: x.CellName,
        conc: x.CellsPerMl
      }));
    }
    const rows = [];
    Object.keys(platemaps).forEach(plateName => {
      const modelsOnPlate = platemaps[plateName] || {};
      Object.keys(modelsOnPlate).forEach(modelName => {
        const model = models[modelName] || {};
        const compartmentRefs = model.MatrixConditionRefsByCompartment || {};
        (modelsOnPlate[modelName] || []).forEach(entry => {
          const wellRange = entry[0], variantName = entry[1];
          const r = resolveMatrixRefsForVariant(compartmentRefs, variantName);
          const pairs = [], seen = {}, names = [];
          r.refs.forEach(ref => {
            cellPairsFor(ref).forEach(p => {
              const k = `${p.name}@${p.conc}`;
              if (!seen[k]) { seen[k] = true; pairs.push(p); }
              if (names.indexOf(p.name) === -1) names.push(p.name);
            });
          });
          rows.push({
            plate: plateName, wellRange, wells: `${wellRange[0]}-${wellRange[1]}`, model: modelName,
            variant: variantName, matrix_codes: r.refs.map(codeFor).join(' + '),
            cells: names.join(', '), cell_pairs: pairs, resolved_via: r.resolvedVia
          });
        });
      });
    });
    return rows;
  }

  // The classic RASTRUM well layout lives in PrintWellModelMaps[].Actions[].P.VariantsInWells
  // (each entry is [ [startWell, endWell], variantName ]). There are no matrix (Px) codes in this
  // format, so matrix_codes stays empty. The inert-base map (fluids all in the "Inert Base" priming
  // group) is skipped, to match the Allegro well map which shows only the placed cell models.
  function buildRastrumWellplateRows(data) {
    const params = data.PrintJobParams || {};
    const fluids = {};
    (params.PrintFluids || []).forEach(f => { fluids[f.Fluid] = f; });
    function isInertOnlyMap(m) {
      const mc = m.MaterialsConfig || {};
      const names = [];
      Object.keys(mc).forEach(slot => {
        (mc[slot] || []).forEach(x => { if (x.Name) names.push(x.Name); });
      });
      if (!names.length) return true;
      return names.every(n => { const f = fluids[n]; return f && f.PrimingGroup === 'Inert Base'; });
    }
    const rows = [];
    (params.PrintWellModelMaps || []).forEach(m => {
      if (isInertOnlyMap(m)) return;
      const model = m.PrintWellModelName || m.Name || '';
      // Cell line and concentration for these wells, parsed from the cell fluid's name
      // (e.g. "F176 - Cell A, 2,000,000/mL").
      let cellName = '', cellPairs = [];
      const mc = m.MaterialsConfig || {};
      Object.keys(mc).forEach(slot => {
        (mc[slot] || []).forEach(x => {
          const f = fluids[x.Name];
          if (f && f.PrimingGroup === 'Cells') {
            const mm = String(x.Name).match(/-\s*(.+?),\s*([\d,]+)\s*\/\s*mL/i);
            if (mm) { cellName = mm[1].trim(); cellPairs = [{ name: cellName, conc: parseInt(mm[2].replace(/,/g, ''), 10) }]; }
            else { const m2 = String(x.Name).match(/-\s*(.+?),/); if (m2) { cellName = m2[1].trim(); cellPairs = [{ name: cellName, conc: null }]; } }
          }
        });
      });
      // The physical plate: classic keys each model map to a WellplateConfig, so different configs are
      // different plates (a multi-plate run has e.g. WP001 and WP031). Fall back to 'W1' when absent.
      const plate = m.WellplateConfig || 'W1';
      (m.Actions || []).forEach(a => {
        const viw = a && a.P && a.P.VariantsInWells;
        if (!viw) return;
        viw.forEach(entry => {
          const wellRange = entry[0], variant = entry[1];
          rows.push({
            plate, wellRange, wells: `${wellRange[0]}-${wellRange[1]}`,
            model, variant, matrix_codes: '', cells: cellName, cell_pairs: cellPairs,
            resolved_via: 'rastrum'
          });
        });
      });
    });
    return rows;
  }

  // Join a short list the way a sentence does: "2", "2 and 3", "2, 3 and 5".
  function listPhrase(items) {
    const a = (items || []).map(String);
    if (a.length <= 1) return a.join('');
    return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
  }

  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }
  // Neutralise CSV formula injection: a cell whose text starts with = + - @ (or a leading tab/CR) is
  // executed as a formula when the file is opened in Excel/Sheets. Prefix a single quote so it is
  // read as literal text. Values not starting with those characters, the normal case, and the
  // analysis join keys (barcode, cell line), are returned unchanged, so programmatic consumers
  // (pandas/R) still read clean values.
  function csvFormulaGuard(v) {
    v = String(v == null ? '' : v);
    return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  }

  // A well range like ["A3","A7"] is always within one row (true of every real file seen), so
  // expanding it is just walking the column numbers between the two endpoints.
  function expandWellRangeToWellIDs(wellRange) {
    const start = wellRange[0], end = wellRange[1];
    const rowLetter = start.charAt(0);
    const startCol = parseInt(start.slice(1), 10), endCol = parseInt(end.slice(1), 10);
    const ids = [];
    for (let c = startCol; c <= endCol; c++) ids.push(rowLetter + c);
    return ids;
  }

  // Plate-map grid CSV, one section per attribute (Model, Matrix code), matching the same
  // plater-style multi-section convention this lab's own existing R scripts already read (a header
  // row of column numbers, then one row per plate row letter), a genuine plate layout, not a list
  // of ranges, which is what people actually expect to see when looking at what was printed.
  function wellplateRowsToCSV(rows) {
    const byPlate = {};
    rows.forEach(r => { (byPlate[r.plate] = byPlate[r.plate] || []).push(r); });

    function section(title, maxCol, byWell) {
      const lines = [title, `,${Array.from({ length: maxCol }, (_, i) => i + 1).join(',')}`];
      let maxRow = -1;
      Object.keys(byWell).forEach(id => {
        const r = id.charCodeAt(0) - 65;
        if (r > maxRow) maxRow = r;
      });
      for (let r = 0; r <= maxRow; r++) {
        const letter = String.fromCharCode(65 + r);
        const vals = [];
        for (let c = 1; c <= maxCol; c++) vals.push(csvEscape(byWell[letter + c] || ''));
        lines.push(`${letter},${vals.join(',')}`);
      }
      return lines.join('\r\n');
    }

    const out = [];
    Object.keys(byPlate).forEach(plateName => {
      const modelByWell = {};
      const matrixByWell = {};
      let maxCol = 0;
      byPlate[plateName].forEach(r => {
        expandWellRangeToWellIDs(r.wellRange).forEach(id => {
          modelByWell[id] = r.model;
          matrixByWell[id] = r.matrix_codes;
          const col = parseInt(id.slice(1), 10);
          if (col > maxCol) maxCol = col;
        });
      });
      out.push(`Plate ${plateName}`);
      out.push(section('Model', maxCol, modelByWell));
      out.push('');
      // Only emit the matrix-code grid when there are matrix codes (Allegro). RASTRUM files have
      // none, so a matrix section there would be an empty grid, skip it rather than print blanks.
      const hasMatrix = Object.keys(matrixByWell).some(id => matrixByWell[id]);
      if (hasMatrix) {
        out.push(section('Matrix code', maxCol, matrixByWell));
        out.push('');
      }
    });
    return out.join('\r\n');
  }

  // Group the well rows into the physical plates the file describes, and summarise each, the input
  // to the run-form multi-plate wizard. Allegro lays out several wellplates in one job
  // (platemaps_by_plate keyed W1, W2, …); classic RASTRUM keys each model map to a WellplateConfig, so
  // different configs are different plates (WP001, WP031, …). Either way the rows already carry a
  // `plate` key, so this just collapses them (in first-seen order) into one entry per plate, carrying
  // the distinct cell lines / matrices / models and the trimmed rows the plate-map visual re-renders
  // from. `allegroData`, when present, resolves each plate's human wellplate name from the catalog.
  function buildDesignedPlates(wellplateRows, allegroData) {
    const order = [], byPlate = {};
    (wellplateRows || []).forEach(r => {
      const p = r.plate || 'W1';
      if (!byPlate[p]) { byPlate[p] = []; order.push(p); }
      byPlate[p].push(r);
    });
    const wellplates = ((allegroData || {}).outcomes || {}).wellplates || [];
    const resources = (allegroData || {}).resources || {};
    return order.map((p, i) => {
      const rows = byPlate[p], cells = [], matrices = [], models = [], concs = [];
      rows.forEach(r => {
        String(r.cells || '').split(', ').forEach(c => { if (c && cells.indexOf(c) === -1) cells.push(c); });
        // Per-plate concentration comes from the paired cell data (r.cell_pairs = [{name, conc}]),
        // collected as the DISTINCT set on this plate. A plate is usually uniform (one value); a plate
        // that mixes concentrations yields several, joined like the cell-line set.
        (r.cell_pairs || []).forEach(cp => {
          const c = String(cp.conc == null ? '' : cp.conc).replace(/[^\d]/g, '');
          if (c && concs.indexOf(c) === -1) concs.push(c);
        });
        // Split compound codes (a Triple-Matrix well stores "A + B + C") and collect DISTINCT
        // individual codes, so the plate summary is a clean set (e.g. "Px01.29, Px01.75") rather than
        // a repetitive string like "Px01.29, Px01.75 + Px01.75 + Px01.29, Px01.75".
        String(r.matrix_codes || '').split(/\s*[+,]\s*/).forEach(mx => {
          if (mx && matrices.indexOf(mx) === -1) matrices.push(mx);
        });
        if (r.model && models.indexOf(r.model) === -1) models.push(r.model);
      });
      concs.sort((a, b) => Number(a) - Number(b));
      // Format label: Allegro maps plate -> outcomes.wellplates[i] (by order) -> catalog name; classic's
      // plate key IS its wellplate config code, so use it directly.
      let format;
      if (allegroData) {
        const code = (wellplates[i] || {}).wellplate_model_code || '';
        format = [code ? allegroPlateName(resources, code) : '', code ? `[${code}]` : '']
          .filter(Boolean).join(' ').trim();
      } else {
        format = /^WP/i.test(p) ? p : '';
      }
      return {
        plate: p, label: `Plate ${i + 1}`, wellplate: format,
        cell_line: cells.join(', '), concentration: concs.join(', '),
        matrix_codes: matrices.sort().join(', '), models: models.join(', '),
        rows: rows.map(r => ({
          wr: r.wellRange,
          m: r.model,
          mx: r.matrix_codes,
          c: r.cells
        }))
      };
    });
  }

  // ─── Plate-map visual ──────────────────────────────────────────────────────
  // A colour-coded plate grid rendered from the well rows, shown on upload so the user can eyeball
  // that the file parsed correctly. Colourblind-safe categorical palette (Okabe-Ito). Adapts to any
  // well count (row/column come from the data), so 96- and 384-well both work.
  const PLATE_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00', '#56B4E9', '#F0E442', '#7B4FB5'];

  function plateMapData(rows) {
    const byWell = {};
    let maxCol = 0;
    let maxRow = 0;
    (rows || []).forEach(r => {
      expandWellRangeToWellIDs(r.wellRange).forEach(id => {
        byWell[id] = { model: r.model || '', matrix: r.matrix_codes || '', cells: r.cells || '' };
        const col = parseInt(id.slice(1), 10); if (col > maxCol) maxCol = col;
        const row = id.charCodeAt(0) - 65; if (row > maxRow) maxRow = row;
      });
    });
    return { byWell, maxCol, maxRow };
  }
  function plateColorMap(byWell, mode) {
    const vals = [];
    Object.keys(byWell).forEach(id => {
      const v = byWell[id][mode] || '';
      if (v && vals.indexOf(v) === -1) vals.push(v);
    });
    vals.sort();
    const map = {};
    vals.forEach((v, i) => { map[v] = PLATE_PALETTE[i % PLATE_PALETTE.length]; });
    return { vals, map };
  }
  function inkFor(hex) {
    const c = String(hex).replace('#', ''); if (c.length < 6) return '#000';
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? 'rgba(0,0,0,.68)' : '#fff';
  }
  function renderPlateMapInto(rows, container) {
    if (!container) return;
    const plates = [];
    rows.forEach(r => { if (plates.indexOf(r.plate) === -1) plates.push(r.plate); });
    plates.sort();
    const allData = plateMapData(rows); // across every plate, used for consistent colours
    const modes = [];
    function anyHas(k) { return Object.keys(allData.byWell).some(id => allData.byWell[id][k]); }
    if (anyHas('matrix')) modes.push({ k: 'matrix', label: 'Matrix' });
    if (anyHas('cells')) modes.push({ k: 'cells', label: 'Cell line' });
    modes.push({ k: 'model', label: 'Model' });
    const state = { mode: modes[0].k, plate: plates[0] };
    container.style.position = 'relative'; // anchor for the floating tooltip
    function draw() {
      // A print run can produce more than one physical plate (e.g. W1 and W2). Render one at a time.
      const prows = plates.length > 1 ? rows.filter(r => r.plate === state.plate) : rows;
      const data = plateMapData(prows);
      // Colours are assigned from ALL plates so a given matrix/cell keeps the same colour across
      // W1/W2; the legend below is filtered to what is actually on the current plate.
      const cm = plateColorMap(allData.byWell, state.mode);
      const cols = data.maxCol, rowsN = data.maxRow;
      let html = `<div class="bpt-pm-toolbar">${modes.map(m => `<button type="button" class="bpt-pm-btn${m.k === state.mode ? ' active' : ''}" data-mode="${m.k}">${esc(m.label)}</button>`).join('')}</div>`;
      if (plates.length > 1) {
        html += `<div class="bpt-pm-plates">${plates.map(p => `<button type="button" class="bpt-pm-pbtn${p === state.plate ? ' active' : ''}" data-plate="${esc(p)}">Plate ${esc(p)}</button>`).join('')}</div>`;
      }
      html += `<div class="bpt-pm-scroll"><div class="bpt-pm-grid" style="grid-template-columns:20px repeat(${cols},minmax(18px,1fr));">`;
      html += '<div class="bpt-pm-hdr"></div>';
      for (let c = 1; c <= cols; c++) html += `<div class="bpt-pm-hdr">${c}</div>`;
      for (let r = 0; r <= rowsN; r++) {
        const letter = String.fromCharCode(65 + r);
        html += `<div class="bpt-pm-hdr">${letter}</div>`;
        for (let c2 = 1; c2 <= cols; c2++) {
          const id = letter + c2, w = data.byWell[id];
          if (w) {
            const val = w[state.mode] || '', col = cm.map[val] || '#e4e8f0';
            html += `<div class="bpt-pm-well" data-id="${esc(id)}" data-model="${esc(w.model)}" data-matrix="${esc(w.matrix || '—')}" data-cells="${esc(w.cells || '—')}" style="background:${col};color:${inkFor(col)};">${esc(id)}</div>`;
          } else {
            html += '<div class="bpt-pm-well bpt-pm-empty"></div>';
          }
        }
      }
      html += '</div></div>';
      const plateVals = plateColorMap(data.byWell, state.mode).vals;
      html += `<div class="bpt-pm-legend">${plateVals.map(v => `<span class="bpt-pm-lg"><span class="bpt-pm-sw" style="background:${cm.map[v]}"></span>${esc(v)}</span>`).join('')}</div>`;
      html += '<div class="bpt-pm-tip" id="bpt-pm-tip"></div>';
      container.innerHTML = html;

      // Floating tooltip anchored to the container (not the scroll box, so it isn't clipped). Delegated
      // on the grid so one handler covers every well and survives a redraw.
      const tip = container.querySelector('#bpt-pm-tip');
      const grid = container.querySelector('.bpt-pm-grid');
      function wellAt(target) {
        let el = target;
        while (el && el !== grid && !(el.className && String(el.className).indexOf('bpt-pm-well') !== -1)) {
          el = el.parentNode;
        }
        return (el && el !== grid && el.getAttribute && el.getAttribute('data-id')) ? el : null;
      }
      grid.addEventListener('mouseover', e => {
        const el = wellAt(e.target);
        if (!el) return;
        tip.innerHTML = `<b>${esc(el.getAttribute('data-id'))}</b><br><span class="k">model</span>${esc(el.getAttribute('data-model'))}<br><span class="k">matrix</span>${esc(el.getAttribute('data-matrix'))}<br><span class="k">cells</span>${esc(el.getAttribute('data-cells'))}`;
        tip.style.display = 'block';
        const cr = container.getBoundingClientRect(), wr = el.getBoundingClientRect();
        let x = (wr.left - cr.left) + wr.width / 2 - tip.offsetWidth / 2;
        x = Math.max(2, Math.min(x, cr.width - tip.offsetWidth - 2));
        let y = (wr.top - cr.top) - tip.offsetHeight - 8;
        if (y < 0) y = (wr.top - cr.top) + wr.height + 8; // flip below when no room above
        tip.style.left = `${x}px`;
        tip.style.top = `${y}px`;
      });
      grid.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

      Array.prototype.forEach.call(container.querySelectorAll('.bpt-pm-btn'), b => {
        b.onclick = () => { state.mode = b.getAttribute('data-mode'); draw(); };
      });
      Array.prototype.forEach.call(container.querySelectorAll('.bpt-pm-pbtn'), b => {
        b.onclick = () => { state.plate = b.getAttribute('data-plate'); draw(); };
      });
    }
    draw();
  }

  // ─── Naming convention ─────────────────────────────────────────────────────
  // Auto-generated, date-sortable, and self-describing names, so nobody has to invent or remember
  // a scheme by hand: {date}_{printer}_{free text, slugified}_{hash6}. The hash suffix is the print
  // file's own SHA-256 (already computed for provenance), so two protocols given the same free-text
  // name never collide, and the exact source file behind a given protocol name is always traceable.
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  // Concise wellplate label for compact UI (the wizard header). The parsed name is a long catalog
  // string, e.g. "<Vendor> 384-well microplates (...), case of 50 (#NNNNNNN) [WP007]".
  // Reduce it to "384-well · WP007" using the well count and the bracketed config code; fall back to
  // the code alone, then to a trimmed original, so it is never blank when a name exists.
  function shortWellplate(name) {
    const s = String(name || '').trim();
    if (!s) return '';
    const well = s.match(/(\d+)\s*-?\s*well/i);
    const code = s.match(/\[([^\]]+)\]/);
    const parts = [];
    if (well) parts.push(`${well[1]}-well`);
    if (code) parts.push(code[1]);
    if (parts.length) return parts.join(' · ');
    return s.length > 40 ? `${s.slice(0, 40)}…` : s;
  }
  function slugify(s) {
    return String(s || '').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  }
  function buildProtocolName(freeText, printer, fileHash) {
    return `${todayISO()}_${printer}_${slugify(freeText)}_${(fileHash || '').slice(0, 6)}`;
  }
  // A print run ID ties every plate created in one "Log print run" batch together, independent of
  // each plate's own sample name/barcode, useful for later finding "everything from this one run".
  // Random rather than sequential: no shared counter exists across browser sessions/users, and a
  // few hex digits is enough entropy that two runs logged the same day won't collide in practice.
  function makePrintRunID() {
    const rand = Array.from({ length: 4 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    return `PR-${todayISO()}-${rand}`;
  }

  function mergeExtracted(list) {
    const out = { print_model: '', wellplate: '', wellplate_description: '', wellplate_display: '',
      cell_line: '', cell_concentration: '', matrix_codes: '', fluid_bioink: '',
      fluid_cell: '', fluid_activator: '', fluid_bioink_base: '', pp_bioink: {}, pp_cell: {} };
    list.forEach(r => {
      Object.keys(out).forEach(key => {
        const current = out[key];
        const isEmpty = typeof current === 'string' ? !current : !Object.keys(current).length;
        const candidate = r[key];
        const hasValue = typeof candidate === 'string' ? !!candidate : candidate && Object.keys(candidate).length;
        if (isEmpty && hasValue) out[key] = candidate;
      });
    });
    return out;
  }

  function parseRastrum(arrayBuffer) {
    if (arrayBuffer.byteLength > CONFIG.MAX_RASTRUM_BYTES) {
      return Promise.reject(new Error('File is unexpectedly large; refusing to parse.'));
    }
    return JSZip.loadAsync(arrayBuffer).then(zip => {
      const names = Object.keys(zip.files);
      // Matches printrun.yaml (combined) and printrun_*.yaml (printed in separate phases, e.g.
      // "cell model only" + "inert base only"), any number of files, merged below.
      const rastrumNames = names.filter(n => /^printrun.*\.yaml$/i.test(n)).sort();
      const allegroName = names.filter(n => /^printplan\.yaml$/i.test(n))[0];
      const targetNames = rastrumNames.length ? rastrumNames : (allegroName ? [allegroName] : []);
      if (!targetNames.length) {
        throw new Error('Not a valid .rastrum file (no printrun*.yaml or printplan.yaml inside).');
      }
      const mf = zip.file('manifest.yaml');
      const pdfEntry = zip.file('protocol.pdf');
      return Promise.all([
        Promise.all(targetNames.map(n => zip.file(n).async('string'))),
        Promise.resolve(!rastrumNames.length),
        Promise.resolve(targetNames),
        mf ? mf.async('string') : Promise.resolve(''),
        sha256Hex(arrayBuffer),
        pdfEntry ? pdfEntry.async('arraybuffer') : Promise.resolve(null)
      ]);
    }).then(parts => {
      const texts = parts[0], isAllegro = parts[1], sourceNames = parts[2], manifestText = parts[3], fileHash = parts[4], pdfBytes = parts[5];
      const totalLen = texts.reduce((s, t) => s + t.length, 0);
      if (totalLen > CONFIG.MAX_RASTRUM_BYTES) {
        throw new Error('Print file contents are unexpectedly large; refusing to parse.');
      }
      let schemaVersion = '';
      try {
        const mo = jsyaml.load(manifestText) || {};
        schemaVersion = mo.version != null ? String(mo.version) : '';
      } catch (e) { /* manifest optional */ }

      const allegroData = isAllegro ? (jsyaml.load(texts[0]) || {}) : null;
      const extracted = isAllegro
        ? extractAllegroDoc(allegroData)
        : mergeExtracted(texts.map(t => extractRastrumDoc(jsyaml.load(t) || {})));

      // Full well-by-well breakdown (every model/well-range on the plate). Allegro comes from
      // platemaps_by_plate (with matrix codes); RASTRUM classic comes from each file's
      // PrintWellModelMaps/VariantsInWells (no matrix codes), concatenated across split-phase files.
      let wellplateRows;
      if (isAllegro) {
        wellplateRows = buildAllegroWellplateRows(allegroData);
      } else {
        wellplateRows = [];
        texts.forEach(t => {
          wellplateRows = wellplateRows.concat(buildRastrumWellplateRows(jsyaml.load(t) || {}));
        });
      }
      const wellplateUnresolvedCount = wellplateRows.filter(r => r.resolved_via === 'UNRESOLVED').length;

      // Uniform vs structured: count the distinct (model + matrix) combinations placed on the plate.
      // One combination means the whole plate is a single printed condition (the drug-screen case);
      // more than one means a structured plate whose detail lives in the well map. This is derived,
      // never asked of the user.
      const comboSet = {}, plateSet = {};
      wellplateRows.forEach(r => {
        comboSet[`${r.model}||${r.matrix_codes}`] = true;
        plateSet[r.plate] = true;
      });
      const distinctCombos = Object.keys(comboSet).length;
      const plateCount = Object.keys(plateSet).length;

      // The summary must reflect what was actually PLACED, not merely defined: a file can declare a
      // matrix condition (e.g. a "Cell B") that no model ever places on a plate. Derive matrix codes,
      // cell lines, and concentrations from the placed well rows so the summary can't over-report, and
      // keep each cell paired with its concentration so multiple concentrations are handled. Falls back
      // to the extractor's values when there are no rows (RASTRUM files without a populated well map).
      let placedCellPairs = [];
      if (wellplateRows.length) {
        const mset = {}, pairMap = {};
        wellplateRows.forEach(r => {
          String(r.matrix_codes || '').split(/\s*\+\s*/).forEach(m => { if (m) mset[m] = true; });
          (r.cell_pairs || []).forEach(p => { pairMap[`${p.name}@${p.conc}`] = p; });
        });
        placedCellPairs = Object.keys(pairMap).map(k => pairMap[k]);
        const names = {}, concs = {};
        placedCellPairs.forEach(p => {
          if (p.name) names[p.name] = true;
          if (p.conc != null) concs[p.conc] = true;
        });
        if (Object.keys(mset).length) extracted.matrix_codes = Object.keys(mset).sort().join(', ');
        if (Object.keys(names).length) extracted.cell_line = Object.keys(names).sort().join(', ');
        if (Object.keys(concs).length) {
          extracted.cell_concentration = Object.keys(concs)
            .sort((a, b) => a - b).join(', ');
        }
      }

      const result = {
        print_model: extracted.print_model,
        wellplate: extracted.wellplate,
        wellplate_description: extracted.wellplate_description,
        wellplate_display: extracted.wellplate_display,
        cell_line: extracted.cell_line,
        cell_concentration: extracted.cell_concentration,
        matrix_codes: extracted.matrix_codes,
        fluid_bioink: extracted.fluid_bioink,
        fluid_cell: extracted.fluid_cell,
        fluid_activator: extracted.fluid_activator,
        fluid_bioink_base: extracted.fluid_bioink_base,
        pp_bioink: extracted.pp_bioink,
        pp_cell: extracted.pp_cell,
        schema_version: schemaVersion,
        file_hash: fileHash,
        source_files: sourceNames.join(', '),
        pdf_bytes: pdfBytes, // ArrayBuffer or null; the human-readable protocol.pdf from inside the .rastrum
        raw_bytes: arrayBuffer, // the original .rastrum bytes, attached to the template so logging can re-parse it

        wellplate_csv: wellplateRows.length ? wellplateRowsToCSV(wellplateRows) : null,
        wellplate_rows: wellplateRows, // kept for the plate-map visual
        designed_plates: buildDesignedPlates(wellplateRows, allegroData), // physical plates the file lays out
        wellplate_row_count: wellplateRows.length,
        wellplate_unresolved_count: wellplateUnresolvedCount,
        wellplate_distinct_combos: distinctCombos,
        wellplate_structured: distinctCombos > 1,
        wellplate_plate_count: plateCount,
        // Printer VERSION the file was designed for, detected from the file itself (Allegro exports a
        // printplan.yaml; classic RASTRUM a printrun*.yaml), never typed by the user. This is the
        // machine generation/model, distinct from the physical unit (the named machine) chosen at
        // log time. Used in the protocol name and shown as a badge in the confirm preview.
        format: isAllegro ? 'Allegro' : 'RASTRUM'
      };
      // Fail loud if the key fields could not be read (an unrecognised/changed export format).
      result.recognized = !!(result.print_model && result.wellplate &&
        (result.fluid_bioink || result.fluid_cell));
      return result;
    });
  }

  // ─── Modal + shared styling ───────────────────────────────────────────────────
  // Self-contained light theme, deliberately not matched to the host eLabNext theme (which is dark and
  // redesigned periodically, so matching it would only go stale). color-scheme:light plus explicit
  // colors on every element stop the host's dark mode bleeding through and making text invisible.
  const STYLE_ID = 'bpt-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css =
      '.bpt-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:999998;' +
        'display:flex;align-items:center;justify-content:center;color-scheme:light;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}' +
      '.bpt-card{background:#fff;color:#1a1a2e;border-radius:12px;' +
        'box-shadow:0 20px 60px rgba(15,23,42,.3),0 2px 8px rgba(15,23,42,.08);' +
        'max-width:90vw;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;}' +
      '.bpt-card-header{padding:18px 20px;border-bottom:1px solid #eef0f3;font-weight:600;' +
        'font-size:16px;letter-spacing:-.01em;color:#1a1a2e;}' +
      '.bpt-card-body{padding:24px 26px;overflow-y:auto;flex:1;font-size:13.5px;line-height:1.55;color:#1a1a2e;}' +
      '.bpt-card-footer{padding:14px 20px;border-top:1px solid #eef0f3;display:flex;' +
        'justify-content:flex-end;gap:8px;background:#fafbfc;}' +
      '.bpt-btn{padding:9px 18px;border-radius:8px;border:none;font-size:13.5px;font-weight:600;' +
        'cursor:pointer;transition:background .15s ease,transform .05s ease;font-family:inherit;}' +
      '.bpt-btn:active{transform:translateY(1px);}' +
      '.bpt-btn-secondary{background:#f1f3f5;color:#334155;}' +
      '.bpt-btn-secondary:hover{background:#e5e8eb;}' +
      '.bpt-btn-primary{background:#4f46e5;color:#fff;}' +
      '.bpt-btn-primary:hover{background:#4338ca;}' +
      '.bpt-field{display:flex;flex-direction:column;gap:4px;}' +
      '.bpt-field label{font-size:12px;font-weight:600;color:#64748b;letter-spacing:.01em;}' +
      '.bpt-field input,.bpt-field select,.bpt-field textarea{padding:8px 10px;border:1px solid #d8dce1;' +
        'border-radius:8px;font-size:13.5px;font-family:inherit;color:#1a1a2e;background:#fff;' +
        'transition:border-color .15s ease,box-shadow .15s ease;box-sizing:border-box;width:100%;}' +
      '.bpt-field input:focus,.bpt-field select:focus,.bpt-field textarea:focus{outline:none;' +
        'border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15);}' +
      '.bpt-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}' +
      '.bpt-stack{display:flex;flex-direction:column;gap:12px;}' +
      '.bpt-combo{position:relative;}' +
      '.bpt-combo-list{position:absolute;left:0;right:0;top:100%;z-index:20;background:#fff;' +
        'border:1px solid #d8dce1;border-radius:8px;margin-top:3px;max-height:240px;overflow-y:auto;' +
        'box-shadow:0 10px 30px rgba(15,23,42,.15);}' +
      '.bpt-combo-item{padding:8px 11px;cursor:pointer;border-bottom:1px solid #f1f3f5;}' +
      '.bpt-combo-item:last-child{border-bottom:none;}' +
      '.bpt-combo-item:hover,.bpt-combo-item.active{background:#eef0fe;}' +
      '.bpt-combo-item .nm{font-size:13px;color:#1a1a2e;font-weight:600;}' +
      '.bpt-combo-item .sub{font-size:11.5px;color:#64748b;margin-top:1px;}' +
      '.bpt-combo-empty{padding:10px 11px;color:#94a3b8;font-size:12.5px;}' +
      // Per-plate review inputs (cell line, concentration) and the typo-guard hint.
      '.bpt-inp{padding:8px 10px;border:1px solid #d8dce1;border-radius:8px;font-size:13.5px;' +
        'font-family:inherit;color:#1a1a2e;background:#fff;box-sizing:border-box;width:100%;}' +
      '.bpt-inp:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15);}' +
      '.bpt-dym{font-size:11.5px;color:#b45309;margin-top:4px;}' +
      '.bpt-hr{border:none;border-top:1px solid #e2e6ec;margin:6px 0 2px;}' +
      '.bpt-section{font-size:13px;font-weight:700;color:#334155;text-transform:none;letter-spacing:0;}' +
      // Repeatable reagent-lot list + its "add" button.
      '.bpt-lots{display:flex;flex-direction:column;gap:6px;}' +
      '.bpt-lot-add{align-self:flex-start;margin-top:6px;border:1px dashed #c7cbd1;background:#fff;' +
        'color:#4f46e5;border-radius:8px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.bpt-lot-add:hover{background:#eef0fe;border-color:#4f46e5;}' +
      '.bpt-dym a{color:#4338ca;font-weight:600;cursor:pointer;text-decoration:underline;}' +
      // Multi-plate wizard: one step per physical plate the file lays out, each showing its own map.
      '.bpt-wiz-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:2px 0 8px;}' +
      '.bpt-wiz-title{font-size:13.5px;font-weight:700;color:#1a1a2e;}' +
      '.bpt-wiz-sub{font-size:12px;color:#64748b;text-align:right;}' +
      '.bpt-wiz-map{margin:2px 0 10px;}' +
      // Per-plate editable fields inside the review step: cell line + concentration, both full-width
      // (two equal columns) so neither is cut off.
      '.bpt-plate-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;margin:0 0 2px;}' +
      '.bpt-wiz-nav{display:flex;justify-content:space-between;align-items:center;margin-top:12px;' +
        'border-top:1px solid #eef0f3;padding-top:10px;}' +
      '.bpt-wiz-btn{border:1px solid #d8dce1;background:#fff;color:#334155;border-radius:8px;padding:7px 13px;' +
        'font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.bpt-wiz-btn:hover:not(:disabled){background:#eef0fe;border-color:#4f46e5;color:#4338ca;}' +
      '.bpt-wiz-btn:disabled{opacity:.4;cursor:default;}' +
      '.bpt-wiz-progress{font-size:12px;color:#475569;font-weight:600;}' +
      '.bpt-wiz-dots{display:flex;gap:5px;}' +
      '.bpt-wiz-dot{width:8px;height:8px;border-radius:50%;background:#d8dce1;}' +
      '.bpt-wiz-dot.active{background:#4f46e5;}' +
      '.bpt-wiz-dot.done{background:#16a34a;}' +   // approved plate
      // Dots jump to a plate, so they need a 24px hit area (the WCAG 2.2 minimum) around an 8px
      // mark. That is a transparent BUTTON wrapping the dot, not padding on the dot itself: padding
      // plus background-clip made the dot's painted area depend on the host's box-sizing, and under
      // border-box it collapsed to nothing, so unapproved dots disappeared entirely.
      '.bpt-wiz-dotbtn{background:none;border:0;padding:8px;margin:0;line-height:0;cursor:pointer;' +
        'border-radius:50%;}' +
      '.bpt-wiz-dotbtn:hover,.bpt-wiz-dotbtn:focus-visible{outline:2px solid #c7d2fe;outline-offset:-2px;}' +
      '.bpt-wiz-dots{gap:0;align-items:center;}' +
      '.bpt-wiz-approve-row{display:flex;justify-content:center;margin-top:10px;}' +
      // A frozen field must stay READABLE. The browser default washes disabled text out until it
      // looks broken rather than deliberately locked.
      '.bpt-inp:disabled{background:#f6f8fa;color:#334155;opacity:1;cursor:default;}' +
      '.bpt-steps>div{margin:0 0 6px;}' +
      // table-layout:fixed makes the <colgroup> widths bind; without it a long filename widens its
      // own column and squeezes the folder number and the button out of shape.
      '.bpt-folder-table{table-layout:fixed;width:100%;}' +
      '.bpt-folder-table td,.bpt-folder-table th{vertical-align:middle;}' +
      // A tenant can hold many folders. The list scrolls in its OWN region rather than letting the
      // dialog body grow: that keeps the instructions above and, more importantly, the save
      // confirmation below it on screen, instead of pushing the confirmation out of view when the
      // folder clicked was near the bottom of a long list.
      '.bpt-folder-scroll{max-height:320px;overflow-y:auto;border:1px solid #eef0f3;border-radius:8px;padding:0 8px;}' +
      // The column headings stay put while that region scrolls, so a row deep in the list can still
      // be read. z-index keeps them above the cells they scroll over.
      '.bpt-folder-table th{position:sticky;top:0;background:#fff;z-index:1;}' +
      '.bpt-wiz-approve{border-color:#4f46e5;color:#4338ca;}' +
      '.bpt-wiz-approve.done{background:#dcfce7;border-color:#16a34a;color:#15803d;}' +
      '.bpt-wiz-status{font-size:12px;color:#475569;margin-top:8px;text-align:center;}' +
      '.bpt-pm-toolbar{display:flex;gap:6px;margin-bottom:6px;}' +
      '.bpt-pm-btn{border:1px solid #d8dce1;background:#f6f7f9;color:#475569;font-family:inherit;' +
        'font-size:12px;font-weight:600;padding:5px 13px;border-radius:7px;cursor:pointer;transition:all .12s ease;}' +
      '.bpt-pm-btn:hover{background:#eef0fe;}' +
      '.bpt-pm-btn.active{background:#4f46e5;color:#fff;border-color:#4f46e5;}' +
      '.bpt-pm-plates{display:flex;gap:6px;margin-bottom:8px;}' +
      '.bpt-pm-pbtn{border:1px solid #d8dce1;background:#fff;color:#475569;font-family:inherit;' +
        'font-size:12px;font-weight:600;padding:4px 12px;border-radius:7px;cursor:pointer;}' +
      '.bpt-pm-pbtn.active{background:#eef0fe;color:#4338ca;border-color:#c7c9f9;}' +
      '.bpt-pm-tip{position:absolute;z-index:30;background:#fff;color:#1a2233;font-size:12.5px;' +
        'line-height:1.5;padding:9px 12px;border-radius:10px;border:1px solid #e2e6ee;pointer-events:none;' +
        'max-width:270px;box-shadow:0 12px 30px rgba(15,23,42,.24);display:none;}' +
      '.bpt-pm-tip b{font-family:ui-monospace,monospace;color:#4338ca;font-size:13.5px;}' +
      '.bpt-pm-tip .k{color:#94a3b8;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;' +
        'margin-right:5px;}' +
      '.bpt-pm-scroll{overflow-x:auto;padding:3px;}' +
      '.bpt-pm-grid{display:grid;gap:3px;min-width:min-content;}' +
      '.bpt-pm-hdr{font-size:10px;color:#94a3b8;text-align:center;display:flex;align-items:center;' +
        'justify-content:center;font-family:ui-monospace,monospace;font-weight:600;}' +
      '.bpt-pm-well{aspect-ratio:1;border-radius:50%;font-size:8px;display:flex;align-items:center;' +
        'justify-content:center;font-family:ui-monospace,monospace;border:1px solid rgba(0,0,0,.06);' +
        'transition:transform .1s ease,box-shadow .1s ease;}' +
      '.bpt-pm-well:hover{transform:scale(1.16);box-shadow:0 0 0 2px rgba(79,70,229,.55);' +
        'z-index:3;position:relative;cursor:default;}' +
      '.bpt-pm-empty{background:#eef0f3;border:1px dashed #d1d5db;}' +
      '.bpt-pm-empty:hover{transform:none;box-shadow:none;}' +
      '.bpt-pm-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:11px;}' +
      '.bpt-pm-lg{display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;}' +
      '.bpt-pm-sw{width:12px;height:12px;border-radius:3px;flex:none;}' +
      '.bpt-copy-btn{border:1px solid #d8dce1;background:#f6f7f9;color:#4338ca;font-family:inherit;' +
        'font-size:11.5px;font-weight:600;padding:3px 11px;border-radius:6px;cursor:pointer;white-space:nowrap;}' +
      '.bpt-copy-btn:hover{background:#eef0fe;border-color:#c7c9f9;}' +
      '.bpt-table{width:100%;border-collapse:collapse;font-size:13px;}' +
      '.bpt-table td{padding:5px 10px 5px 0;}' +
      '.bpt-table td:first-child{color:#64748b;}' +
      '.bpt-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;' +
        'font-weight:700;margin:0 0 4px;}' +
      '.bpt-name{font-size:15px;font-weight:700;color:#1a1a2e;letter-spacing:-.01em;word-break:break-all;' +
        'margin:0 0 16px;font-family:ui-monospace,"SF Mono",Menlo,monospace;}' +
      '.bpt-speccard{background:#f8fafc;border:1px solid #eef1f5;border-radius:12px;padding:17px 19px;margin:0 0 14px;}' +
      '.bpt-summary{display:grid;grid-template-columns:1fr 1fr;gap:15px 28px;margin:0;}' +
      '.bpt-sf{min-width:0;}' +
      '.bpt-sf-2{grid-column:1 / -1;}' +
      '.bpt-sf-label{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;' +
        'font-weight:700;margin-bottom:4px;}' +
      '.bpt-sf-val{font-size:14px;color:#1a1a2e;font-weight:500;line-height:1.35;}' +
      '.bpt-chips{display:flex;flex-wrap:wrap;gap:5px;}' +
      '.bpt-chip{display:inline-block;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;line-height:1.55;}' +
      '.bpt-chip-matrix{background:#eef0fe;color:#4338ca;}' +
      '.bpt-chip-cell{background:#e7f6f2;color:#0f766e;}' +
      '.bpt-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 12px;' +
        'border-radius:8px;font-size:12.5px;margin-top:2px;}' +
      '.bpt-hint{color:#475569;font-size:14.5px;font-weight:500;margin:0 0 12px;}' +
      '.bpt-details{margin-top:10px;color:#64748b;}' +
      '.bpt-details summary{cursor:pointer;font-size:12.5px;font-weight:600;color:#475569;padding:3px 0;}' +
      '.bpt-details summary:hover{color:#4f46e5;}';
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  function closeModal() {
    const el = document.getElementById('bpt-modal-overlay');
    if (el) el.remove();
  }
  addon.closeModal = closeModal;

  function showDialog(config) {
    closeModal();
    injectStyles();
    const buttons = config.customButtons || [];
    const btnHTML = buttons.map((b, i) => `<button id="bpt-btn-${i}" class="bpt-btn bpt-btn-primary">${esc(b.label)}</button>`).join('');
    const overlay = document.createElement('div');
    overlay.id = 'bpt-modal-overlay';
    overlay.className = 'bpt-overlay';
    overlay.innerHTML =
      `<div class="bpt-card" style="width:${config.width || 400}px;"><div class="bpt-card-header">${esc(config.title || '')}</div><div class="bpt-card-body">${config.content || ''}</div><div class="bpt-card-footer"><button id="bpt-cancel" class="bpt-btn bpt-btn-secondary">${esc(config.btnCancelLabel || 'Close')}</button>${btnHTML}</div></div>`;
    document.body.appendChild(overlay);
    // config.confirmDiscard marks a dialog whose contents are lost on exit (a form that has not been
    // submitted). Any edit inside it sets a dirty flag, and only then does leaving ask. Tracking real
    // edits rather than "has fields" keeps an untouched form from nagging on the way out. Programmatic
    // pre-fills do not fire input/change, so they correctly leave the form clean; a choice made by
    // clicking (selecting a protocol) calls markDialogDirty itself.
    if (config.confirmDiscard) {
      const card = overlay.querySelector('.bpt-card');
      if (card) {
        const mark = () => { overlay.setAttribute('data-bpt-dirty', '1'); };
        card.addEventListener('input', mark);
        card.addEventListener('change', mark);
      }
    }
    // config.onCancel lets a dialog send the cancel/"Back" button somewhere other than closing
    // outright (e.g. back to the previous step), while clicking outside the dialog always just closes.
    document.getElementById('bpt-cancel').onclick = () => {
      // window.confirm, not a dialog of our own: our dialogs replace the current one, which would
      // destroy the very form the user might choose to keep.
      if (overlay.getAttribute('data-bpt-dirty') === '1' &&
        typeof window !== 'undefined' && typeof window.confirm === 'function' &&
        !window.confirm('Leave this form? Anything entered here will be lost.')) return;
      if (config.onCancel) { try { config.onCancel(); } catch (e) { console.error('Bioprint Tracker add-on error:', e); } }
      else closeModal();
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    buttons.forEach((b, i) => {
      document.getElementById(`bpt-btn-${i}`).onclick = () => {
        try { b.fn(); } catch (e) {
          console.error('Bioprint Tracker add-on error:', e);
          showError('Unexpected error', (e && e.message) || String(e));
        }
      };
    });
    if (config.afterRender) config.afterRender();
  }

  // Marks the open dialog as having unsaved input, for a choice made by clicking rather than typing
  // (input/change never fires for those, so the delegated listeners in showDialog cannot see it).
  function markDialogDirty() {
    const el = document.getElementById('bpt-modal-overlay');
    if (el) el.setAttribute('data-bpt-dirty', '1');
  }

  function showError(title, msg) {
    showDialog({ title, width: 420, content: `<p class="bpt-error">${esc(msg)}</p>` });
  }

  function field(label, id, type, placeholder, value, extra) {
    const tag = type === 'textarea' ? 'textarea' : 'input';
    return `<div class="bpt-field"><label>${esc(label)}</label><${tag} id="${id}"${type !== 'textarea' ? ` type="${type}"` : ''} placeholder="${esc(placeholder || '')}"${value !== undefined ? ` value="${esc(value)}"` : ''} ${extra || ''}>${type === 'textarea' ? '</textarea>' : ''}</div>`;
  }

  function val(id) { const e = document.getElementById(id); return e ? String(e.value).trim() : ''; }

  // ─── Entry point ───────────────────────────────────────────────────────────
  // `configuration` is whatever the tenant admin set via the Developer Platform's Configuration
  // Schema / Default Configuration for this add-on (see config.schema.json / config.default.json
  // in this folder). It lets the two sample-type IDs be set per-tenant without editing this file.
  addon.init = configuration => {
    applyConfig(configuration);
    // The platform does not always hand the configuration to init: it passes nothing when the add-on
    // is side-loaded, and an install whose published version predates the configuration schema has
    // no schema to render or deliver (the empty Configure dialog seen in a production tenant, 2026-07-31).
    // In those cases read the stored value over the API instead, which does not depend on the schema
    // or on the dialog. Skipped when init already supplied a folder, so the platform stays
    // authoritative where it speaks. Never fatal: an unreadable configuration just leaves defaults.
    if (!configuration || configuration.pdfFolderID == null || configuration.pdfFolderID === '') {
      configReady = readStoredConfig().then(applyConfig, () => {});
    }
    // Placement. A top-nav "Bioprint Tracker" tab via eLabSDK.CustomPage was
    // tried and removed: it rendered an empty page on the tenant because CustomPage's content
    // contract is undocumented, so the page body could not be supplied reliably.
    //
    // PRIMARY placement: a "Bioprint Tracker" button in the Inventory sample browser, under "+ Add
    // Sample" in Browser V2, and on the classic-browser toolbar in v1. A printed plate is a sample,
    // so this is where the launcher belongs, and it uses a supported API (unlike CustomPage).
    installInventoryButtons();
    // Hidden setup entry points, opened via URL hash (one-time admin tasks, deliberately NOT visible
    // menu items, they would clutter the everyday UI for every user). Also callable from the console:
    //   #bioprinting-check-types → addon.checkSampleTypes()  (read-only: confirm types + fields)
    //   #bioprinting-setup-types → addon.setupSampleTypes()  (create the two sample types + fields)
    //   #bioprinting-setup       → addon.showSetupHub()      (the setup chooser: all of the above)
    // The specific ...-types hashes are kept as direct shortcuts; the plain hash opens the hub. Checked
    // most-specific first, because each hash contains the substring of the next.
    function maybeOpenSetup() {
      const loc = (typeof window !== 'undefined' && window.location) ||
        (typeof location !== 'undefined' ? location : null);
      const hash = (loc && loc.hash) || '';
      if (/bioprinting-check-types/i.test(hash)) {
        try { addon.checkSampleTypes(); } catch (e) { /* setup helper is best-effort */ }
      } else if (/bioprinting-setup-types/i.test(hash)) {
        try { addon.setupSampleTypes(); } catch (e) { /* setup helper is best-effort */ }
      } else if (/bioprinting-setup/i.test(hash)) {
        try { addon.showSetupHub(); } catch (e) { /* setup helper is best-effort */ }
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', maybeOpenSetup);
    } else {
      maybeOpenSetup();
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('hashchange', maybeOpenSetup);
    }
  };

  // The contextually correct home for the launcher: a button in the Inventory sample browser.
  // Registered for BOTH the classic browser (eLabSDK v1) and Inventory Browser V2 (eLabSDK2),
  // because a tenant may still serve either while V2 rolls out, the correct one renders, the other
  // is a harmless no-op. Both registrations are keyed by the same id/actionID (idempotent, so a
  // re-run overwrites rather than duplicates). Returns true if at least one native path registered
  // without error.
  function installInventoryButtons() {
    let installed = false;
    // Classic Inventory browser (v1): a toolbar button placed before the standard "Add Sample".
    try {
      if (typeof eLabSDK !== 'undefined' && eLabSDK.Page && eLabSDK.Page.Sample &&
        eLabSDK.GUI && eLabSDK.GUI.Button) {
        const samplePage = new eLabSDK.Page.Sample({});
        if (typeof samplePage.addButton === 'function') {
          samplePage.addButton(new eLabSDK.GUI.Button({
            label: 'Bioprint Tracker', type: 'confirm', actionID: 'bptLauncher',
            action() { addon.showMainDialog(); }
          }));
          installed = true;
        }
      }
    } catch (e) {
      console.warn('Bioprint Tracker: classic Inventory-toolbar button not available in this context:', e);
    }
    // Inventory Browser V2 (eLabSDK2): a button under the "+ Add Sample" button. Per the SDK2 recipe,
    // registerAddSampleAction places a launcher button whose onClick can run anything (here: open our
    // dialog); the sampleData argument is ignored because we create samples from a file, not from the
    // add-sample form. SDK2 is BETA, so this is feature-detected and wrapped rather than assumed.
    try {
      if (typeof eLabSDK2 !== 'undefined' && eLabSDK2.Inventory && eLabSDK2.Inventory.Sample &&
        eLabSDK2.Inventory.Sample.SampleList &&
        typeof eLabSDK2.Inventory.Sample.SampleList.registerAddSampleAction === 'function') {
        eLabSDK2.Inventory.Sample.SampleList.registerAddSampleAction({
          id: 'bptLauncher',
          label: 'Bioprint Tracker',
          title: 'Register a RASTRUM bioprint (protocol and its barcoded plates)',
          icon: 'fas fa-print',
          onClick() { addon.showMainDialog(); },
          isVisible() { return true; }
        });
        installed = true;
      }
    } catch (e) {
      console.warn('Bioprint Tracker: Inventory Browser V2 button not available in this context:', e);
    }
    return installed;
  }

  // True when BOTH sample types can be found for the active group (or a numeric ID override is set).
  // Never rejects. Drives the launcher's "finish setup" nudge. Relies on resolveSampleTypeID caching
  // only SUCCESSES, so an un-set-up group is re-checked on every launcher open (the nudge clears
  // itself once an admin runs setup), while a set-up group is served instantly from cache. We do NOT
  // cache a yes/no flag ourselves, precisely so a stale "not ready" can't linger.
  function isTenantConfigured() {
    return Promise.all([
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template'),
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PLATE, 'Bioprinted Plate')
    ]).then(() => true, () => false);
  }

  addon.showMainDialog = () => {
    const buttons = [
      { label: 'Upload protocol', fn() { closeModal(); addon.showProtocolDialog(); } },
      { label: 'Log print run', fn() { closeModal(); addon.showRunDialog(); } }
    ];
    showDialog({
      width: 440, title: `Bioprint Tracker (v${ADDON_VERSION})`,
      // The everyday actions are the primary buttons. Setup is NOT a primary button (it would clutter
      // the menu everyone sees every day): instead a quiet "Set up / check" link sits at the bottom
      // for admins, and, only when this group is not set up yet, a prominent nudge appears above,
      // injected asynchronously so the common (already-set-up) case renders with no delay.
      content:
        '<div id="bpt-setup-nudge"></div>' +
        '<p class="bpt-hint">What would you like to do?</p>' +
        '<p class="bpt-hint" style="margin:14px 0 0;font-size:12px;opacity:0.75;">' +
          'Admin: <a href="#" id="bpt-setup-link">Set up / check</a> the sample types and file folder.</p>',
      customButtons: buttons,
      afterRender() {
        const link = document.getElementById('bpt-setup-link');
        if (link) link.onclick = e => {
          if (e && e.preventDefault) e.preventDefault();
          closeModal(); addon.showSetupHub();
        };
        isTenantConfigured().then(ready => {
          if (ready) return;
          const box = document.getElementById('bpt-setup-nudge');
          if (!box) return;
          box.innerHTML =
            '<div style="border:1px solid #e0b34d;background:#fdf6e3;border-radius:6px;padding:10px 12px;margin:0 0 12px;">' +
              '<p class="bpt-hint" style="margin:0 0 8px;color:#7a5b00;"><b>Not set up for your group yet.</b> ' +
              'Before this add-on can be used here, a <b>group administrator</b> needs to create its two ' +
              'sample types once (and, optionally, choose a file folder). Sample types belong to a group, ' +
              'so each group is set up separately.</p>' +
              '<button id="bpt-nudge-setup" class="bpt-btn bpt-btn-primary" style="margin:0;">Set up now</button>' +
            '</div>';
          const b = document.getElementById('bpt-nudge-setup');
          if (b) b.onclick = () => { closeModal(); addon.showSetupHub(); };
        });
      }
    });
  };

  // The setup "hub": one place that gathers the one-time admin tasks, reached from the launcher's
  // "Set up / check" button or the #bioprinting-setup hash. Each button opens the relevant dialog;
  // the descriptions above them say, in plain language, what each does and who can run it.
  addon.showSetupHub = () => {
    showDialog({
      width: 480, title: 'Bioprint Tracker setup',
      content: '<p class="bpt-hint" style="margin:0 0 10px;">One-time setup, normally done once per ' +
        'lab by an administrator. Choose a task:</p>' +
        '<ul class="bpt-hint" style="margin:0;padding-left:18px;">' +
          '<li><b>Set up sample types</b> — creates the two record types this add-on needs, with all ' +
            'their fields. Needs an administrator account.</li>' +
          '<li><b>Check sample types</b> — confirms those types and their fields are complete. Only ' +
            'looks; changes nothing.</li>' +
          '<li><b>Choose file folder</b> — picks the Data Storage folder that uploaded files go into, ' +
            'and saves the choice.</li>' +
        '</ul>',
      customButtons: [
        { label: 'Set up sample types', fn() { closeModal(); addon.setupSampleTypes(); } },
        { label: 'Check sample types', fn() { closeModal(); addon.checkSampleTypes(); } },
        { label: 'Choose file folder', fn() { closeModal(); addon.showFolderIdFinder(); } }
      ]
    });
  };

  // Collapse a file list into one entry per Data Storage folder. There is no list-folders and no
  // folder-by-NAME endpoint (confirmed by eLabNext dev support 2026-07-24), so the only way to
  // surface a folder is to read the `folderID` off files that already sit in it. Folders are
  // therefore identified by an EXAMPLE FILENAME they contain: recognising a file you put there is how
  // you tell one folder from another. A folder with no files in it cannot appear at all, which is why
  // the dialog also offers manual entry. Busiest folder first. Pure, so it is unit-tested.
  // Shorten a filename from the MIDDLE, so both the start and the distinguishing tail survive
  // ("2026-07-22_Allegro_newconfig_4f8b7f_wellplate.csv" -> "2026-07-22_Alle…_wellplate.csv"). Cutting
  // the end instead would leave a column of names that all begin identically and cannot be told apart.
  function shortenMiddle(name, max) {
    const s = String(name == null ? '' : name);
    if (s.length <= max) return s;
    const keepEnd = Math.max(6, Math.floor((max - 1) / 2));
    const keepStart = max - 1 - keepEnd;
    return `${s.slice(0, keepStart)}…${s.slice(s.length - keepEnd)}`;
  }

  function groupFilesByFolder(files) {
    const byFolder = {}, order = [];
    (files || []).forEach(f => {
      const id = (!f || f.folderID == null || f.folderID === 0) ? 0 : f.folderID;
      if (!byFolder[id]) { byFolder[id] = { id, count: 0, names: [] }; order.push(id); }
      byFolder[id].count++;
      const name = f && (f.filename || f.realName);
      if (byFolder[id].names.length < 3 && name) byFolder[id].names.push(name);
    });
    return order.map(id => byFolder[id]).sort((a, b) => b.count - a.count);
  }

  // Setup helper (hidden; #bioprinting-setup or console): lists the Data Storage folders that hold
  // files, with their numbers, and SAVES the chosen one as this add-on's configuration.
  //
  // It saves the value itself rather than sending the user to the platform's Configure dialog. That
  // dialog rendered empty in a production tenant while working in the sandbox (2026-07-31), which left the
  // folder unsettable; writing through the API does not depend on the configuration schema being
  // delivered to the install. See saveStoredConfig. Saving is refused by the server (403) for a user
  // who may not edit the install's configuration, and is unavailable when side-loading (no installed
  // record, so no sdkPluginID); both are reported in the dialog rather than failing quietly.
  addon.showFolderIdFinder = () => {
    let current = CONFIG.PDF_FOLDER_ID || 0;
    const describe = id => (id ? `folder number ${esc(id)}` : 'the main file area (no folder chosen)');
    showDialog({
      width: 640, title: 'Choose your file folder',
      // The exit button names its destination. A bare "Back" makes the reader reconstruct where
      // they came from, and in the run dialog it collided with the wizard's own plate-level Back.
      btnCancelLabel: '‹ Back to setup', onCancel() { addon.showSetupHub(); },
      content:
        `<p class="bpt-hint" style="margin:0 0 10px;">Files are being saved in: <b id="bpt-folder-current">${describe(current)}</b>.</p>` +
        '<p class="bpt-hint" style="margin:0 0 12px;">Keeping uploaded files in one folder needs that ' +
        'folder’s <b>number</b>. To find it:</p>' +
        // Steps are numbered in the markup rather than by <ol>: the host stylesheet strips list
        // markers, which left the instructions as unnumbered indented lines.
        '<div class="bpt-hint bpt-steps">' +
          '<div><b>1.</b> In <b>Data Storage</b>, open the folder you want to use and put any file ' +
            'in it (for example a file called <code>bioprinting.txt</code>).</div>' +
          '<div><b>2.</b> Find that file in the list below and press <b>Use this folder</b> next ' +
            'to it.</div>' +
        '</div>' +
        '<div id="bpt-folder-list" class="bpt-folder-scroll"><p class="bpt-hint">Loading folders…</p></div>' +
        '<div id="bpt-folder-status" style="margin:10px 0 0;"></div>',
      // There is deliberately no "type a folder number" box. A typed number cannot be checked: there
      // is no endpoint to confirm a folder exists or belongs to this group, and placement is accepted
      // only at upload with no way to move a file afterwards, so one typo would send every later
      // upload somewhere unrecoverable. Every button below points at a folder we have just read files
      // out of, so it is known to exist. A folder holding no files cannot be listed at all, which is
      // why the instructions above say to drop a marker file into it first.
      afterRender() {
        const box = document.getElementById('bpt-folder-list');
        const statusBox = document.getElementById('bpt-folder-status');
        let rows = [], installedRecord = null;

        function status(html, kind) {
          if (!statusBox) return;
          const colour = kind === 'error' ? '#b91c1c' : (kind === 'ok' ? '#15803d' : '#64748b');
          statusBox.innerHTML = `<p class="bpt-hint" style="margin:0;color:${colour};font-weight:600;">${html}</p>`;
        }
        function setButtonsDisabled(disabled) {
          const btns = document.querySelectorAll('[data-bpt-folder]');
          Array.prototype.forEach.call(btns, b => { b.disabled = disabled; });
        }

        // Redrawn after every save, not only on open: the chosen row has to carry the "in use" mark
        // and lose its button, and the previously chosen row has to give both up. Updating only the
        // line at the top would leave the table contradicting it until the dialog was reopened.
        function renderTable() {
          if (!rows.length) {
            box.innerHTML = '<p class="bpt-hint">No files found yet, so there are no folders to show. ' +
              'Put a file into the folder you want to use in Data Storage, then open this again.</p>';
            return;
          }
          box.innerHTML = `<table class="bpt-table bpt-folder-table"><colgroup><col style="width:88px;"><col><col style="width:48px;"><col style="width:124px;"></colgroup><tr><th>Folder</th><th>Example file(s) in it</th><th>Files</th><th></th></tr>${rows.map(r => {
            const label = r.id === 0 ? '<i>main file area</i>' : esc(r.id);
            const isCur = String(r.id) === String(current) || (r.id === 0 && !current);
            // Print filenames are long (a full RASTRUM export name runs past 40 characters), and
            // three of them wrapped over several lines and crushed the other columns. Two, each
            // shortened in the middle so the distinctive tail stays visible, is enough to recognise
            // a folder by. The full list is on the cell's tooltip.
            const shown = r.names.slice(0, 2).map(n => shortenMiddle(n, 30));
            const eg = r.names.length
              ? esc(shown.join(', ')) + (r.count > shown.length ? ', …' : '')
              : '—';
            const egFull = r.names.length ? ` title="${esc(r.names.join(', '))}"` : '';
            // The "in use" mark lives with the folder name, not in the button column, so it is still
            // shown when saving is unavailable (side-loading) and that column is empty.
            const mark = isCur ? '<div style="color:#15803d;font-weight:700;font-size:11px;">✓ in use</div>' : '';
            const action = (!installedRecord || isCur) ? ''
              : `<button type="button" class="bpt-btn bpt-btn-secondary" style="margin:0;padding:5px 10px;white-space:nowrap;" data-bpt-folder="${esc(r.id)}">Use this folder</button>`;
            // The chosen row is marked three ways (tint, left rule, and the tick) rather than by
            // colour alone, which would be invisible to a colourblind reader and easy to miss.
            // The rule is a BORDER on the first cell, not an inset shadow on the row: a row-level
            // inset shadow paints inside the first cell and ran underneath the folder number. Both
            // states reserve the same 11px on the left, so text stays aligned as the mark moves.
            const rowStyle = isCur ? ' style="background:#eef6ff;"' : '';
            const firstCell = isCur
              ? 'white-space:nowrap;border-left:3px solid #4f46e5;padding-left:8px;'
              : 'white-space:nowrap;padding-left:11px;';
            return `<tr${rowStyle}><td style="${firstCell}"><b>${label}</b>${mark}</td><td style="overflow-wrap:anywhere;"${egFull}>${eg}</td><td>${esc(r.count)}</td><td>${action}</td></tr>`;
          }).join('')}</table>`;
          const btns = document.querySelectorAll('[data-bpt-folder]');
          Array.prototype.forEach.call(btns, b => {
            b.onclick = () => { save(parseInt(b.getAttribute('data-bpt-folder'), 10) || 0); };
          });
        }

        // Saving replaces the whole stored configuration, so failures must be visible, never assumed.
        function save(id) {
          setButtonsDisabled(true);
          status('Saving…');
          saveStoredConfig({ pdfFolderID: id }).then(() => {
            CONFIG.PDF_FOLDER_ID = id;
            current = id;
            const line = document.getElementById('bpt-folder-current');
            if (line) line.innerHTML = describe(id);
            renderTable();
            status(`Saved. New uploads will go to <b>${describe(id)}</b>.`, 'ok');
          }).catch(err => {
            setButtonsDisabled(false);
            const msg = (err && err.message) || String(err);
            if (/\(403\)|forbidden/i.test(msg)) {
              status('Not saved: this account was not permitted to change the add-on’s settings. Ask ' +
                'an administrator to choose the folder.', 'error');
            } else {
              status(`Not saved: ${esc(msg)}`, 'error');
            }
          });
        }

        // The installed record is fetched alongside the file list because its sdkPluginID is what the
        // configuration is stored against. Without it the numbers are still worth showing, so a
        // failure disables saving rather than emptying the dialog.
        Promise.all([
          listFiles().then(f => ({ files: f }), err => ({ error: err })),
          getInstalledAddon().then(a => a, () => null)
        ]).then(res => {
          const filesResult = res[0];
          installedRecord = res[1];
          if (filesResult.error) {
            box.innerHTML = `<p class="bpt-error">Could not list files: ${esc(filesResult.error.message)}</p>`;
          } else {
            rows = groupFilesByFolder(filesResult.files);
            renderTable();
          }
          if (!installedRecord) {
            status('No installed record was found for this add-on here, so the choice cannot be saved ' +
              'from this screen. Note the folder number and set it in the add-on’s Configure screen ' +
              'instead.', 'error');
          }
        });
      }
    });
  };

  // Draw the results of a setup or check run into the given box, in plain language. `results` is a
  // list of {name, action, typeID?, fieldCount?, error?, check?}. Shared by setupSampleTypes and
  // checkSampleTypes (the wording works for both, so no setup-vs-check flag is needed).
  function renderSampleTypeResults(boxId, results) {
    const box = document.getElementById(boxId);
    if (!box) return;
    // Inline coloured text (not the .bpt-error alert box, which would render as a full red panel).
    const BAD = 'color:#b91c1c;font-weight:600', GOOD = 'color:#15803d;font-weight:600';
    let anyForbidden = false, anyProblem = false;
    const rows = results.map(r => {
      let status = '', note = '';
      if (r.action === 'forbidden') {
        anyForbidden = true;
        status = `<span style="${BAD}">Not done (needs an admin account)</span>`;
      } else if (r.action === 'failed') {
        anyProblem = true;
        status = `<span style="${BAD}">Something went wrong</span>`;
        note = esc(r.error || '');
      } else if (r.action === 'missing') {
        anyProblem = true;
        status = `<span style="${BAD}">Not set up yet</span>`;
        note = 'This type does not exist. Run the setup to create it.';
      } else {
        // created / updated / exists: show the field check.
        const base = r.action === 'created' ? 'Created' : (r.action === 'updated' ? 'Updated' : 'Already set up');
        const c = r.check || {};
        const added = (r.added && r.added.length) ? `Added ${r.added.length} field(s): ${esc(r.added.join(', '))}.` : '';
        if (c.readFailed) {
          status = base;
          note = `${added} Could not re-check the fields.`.trim();
        } else if ((c.missing && c.missing.length) || (c.mismatched && c.mismatched.length)) {
          anyProblem = true;
          status = `<span style="${BAD}">${base}, needs attention</span>`;
          const parts = [];
          if (added) parts.push(added);
          if (c.missing && c.missing.length) parts.push(`Still missing: ${esc(c.missing.join(', '))}`);
          if (c.mismatched && c.mismatched.length) parts.push(`Wrong type: ${esc(c.mismatched.map(m => `${m.key} (should be ${prettyType(m.expected)}, is ${prettyType(m.got)})`).join('; '))}`);
          note = parts.join(' ');
        } else {
          status = `<span style="${GOOD}">${base}, all ${esc(c.ok)} fields correct</span>`;
          if (added) note = added;
        }
      }
      return `<tr><td>${esc(r.name)}</td><td>${status}${note ? `<br><span class="bpt-hint">${note}</span>` : ''}</td></tr>`;
    }).join('');
    const footer = anyForbidden
      ? '<p class="bpt-hint">Creating or changing sample types requires an <b>administrator</b> account. ' +
        'Ask an admin to run this (open Inventory with <code>#bioprinting-setup-types</code> in the address).</p>'
      : anyProblem
        ? '<p class="bpt-hint">Fix the items marked above by hand in <b>Configuration → Sample types</b> ' +
          '(add any still-missing field, or correct a wrong-type field), then run this again to confirm.</p>'
        : '<p class="bpt-hint">Everything is set up correctly. You can start uploading protocols and ' +
          'logging print runs.</p>';
    box.innerHTML = `<table class="bpt-table"><tr><th>Sample type</th><th>Status</th></tr>${rows}</table>${footer}`;
  }

  // Setup helper (hidden; #bioprinting-setup-types or console BioprintTracker.setupSampleTypes()):
  // create the two required sample types and their fields, so an admin doesn't have to build them by
  // hand, then check every field came through with the right type. No client-side role gate (there is
  // no working role API, see isForbidden); it attempts creation and reports a 403 as "needs an admin
  // account". A type that already exists has any MISSING fields added, then is re-checked; a field that
  // exists with the wrong type is reported, not changed (changing a field's type is not safe to automate).
  addon.setupSampleTypes = () => {
    const names = Object.keys(REQUIRED_SAMPLE_TYPE_FIELDS);
    showDialog({ width: 560, title: 'Set up sample types',
      btnCancelLabel: '‹ Back to setup', onCancel() { addon.showSetupHub(); },
      content: `<div id="bpt-setup-status"><p class="bpt-hint">Working on ${esc(names.length)} sample types…</p></div>` });
    const results = [];
    let chain = Promise.resolve();
    names.forEach(name => {
      chain = chain.then(() => {
        const required = REQUIRED_SAMPLE_TYPE_FIELDS[name];
        // If the type exists, top up any MISSING fields (adding a field is non-destructive), then
        // re-check. If it does not exist, create it with all its fields. A field that exists with the
        // WRONG type is reported, not auto-changed (changing a field's type is not safe to automate).
        return resolveSampleTypeID(0, name).then(id => getSampleTypeMetaMap(id).then(map => {
          const check = checkTypeFields(map, required);
          const missing = (check && check.missing) || [];
          if ((check && check.readFailed) || !missing.length) {
            results.push({ name, action: 'exists', typeID: id, check });
            return undefined;
          }
          const toAdd = required.filter(f => missing.indexOf(f.key) !== -1);
          return addFieldsToType(id, toAdd).then(() => getSampleTypeMetaMap(id, true).then(map2 => {
            results.push({ name, action: 'updated', typeID: id, added: toAdd.map(f => f.key), check: checkTypeFields(map2, required) });
          }), err => {
            results.push({ name, action: isForbidden(err) ? 'forbidden' : 'failed', error: err.message });
          });
        }), () => createSampleTypeWithFields(name, required, REQUIRED_SAMPLE_TYPE_DESCRIPTIONS[name]).then(r => getSampleTypeMetaMap(r.typeID).then(map => {
          results.push({ name, action: 'created', typeID: r.typeID,
            fieldCount: r.fieldCount, check: checkTypeFields(map, required) });
        }), err => {
          results.push({ name, action: isForbidden(err) ? 'forbidden' : 'failed', error: err.message });
        }));
      });
    });
    chain.then(() => { renderSampleTypeResults('bpt-setup-status', results); });
  };

  // Check helper (hidden; #bioprinting-check-types or console BioprintTracker.checkSampleTypes()):
  // READ-ONLY, never creates or changes anything. For each required type it looks up the type by
  // name and reports whether every field is present with the right type, so an admin can confirm a
  // hand-built (or previously auto-built) setup is complete.
  addon.checkSampleTypes = () => {
    const names = Object.keys(REQUIRED_SAMPLE_TYPE_FIELDS);
    showDialog({ width: 560, title: 'Check sample types',
      btnCancelLabel: '‹ Back to setup', onCancel() { addon.showSetupHub(); },
      content: `<div id="bpt-check-status"><p class="bpt-hint">Checking ${esc(names.length)} sample types…</p></div>` });
    const results = [];
    let chain = Promise.resolve();
    names.forEach(name => {
      chain = chain.then(() => {
        const required = REQUIRED_SAMPLE_TYPE_FIELDS[name];
        return resolveSampleTypeID(0, name).then(id => getSampleTypeMetaMap(id).then(map => {
          results.push({ name, action: 'exists', typeID: id, check: checkTypeFields(map, required) });
        }), () => {
          results.push({ name, action: 'missing' });
        });
      });
    });
    chain.then(() => { renderSampleTypeResults('bpt-check-status', results); });
  };

  // ─── Flow 1: upload a .rastrum and register it as a protocol Sample ──────────
  // Looks for an already-registered protocol with the same source-file hash, so re-uploading the
  // exact same .rastrum warns instead of silently creating a duplicate. Best-effort: on any list
  // error (or no hash) it resolves null, and the upload proceeds normally, it never falsely blocks.
  function findProtocolByHash(protocolTypeID, hash) {
    if (!hash) return Promise.resolve(null);
    return listSamplesByType(protocolTypeID).then(list => list.filter(p => metaValueByName(p.meta, 'Source file hash') === hash)[0] || null).catch(() => null);
  }

  // `prefill` (optional {name, printer}) lets "Back" from the confirm step reopen this dialog
  // without losing what was typed, only the file itself can't be restored (browsers block
  // scripts from setting a file input's value), so that one still needs re-choosing.
  addon.showProtocolDialog = prefill => {
    prefill = prefill || {};
    // Check the Bioprint Template sample type is resolvable BEFORE showing the form, otherwise
    // someone could pick a file, type a name, and only discover the setup problem after all that,
    // at the very last step. Fail fast and clearly instead, same pattern as showRunDialog.
    resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template').then(typeID => {
      addon.showProtocolForm(prefill, typeID);
    }).catch(err => { showError('Not set up yet', err.message); });
  };

  addon.showProtocolForm = (prefill, protocolTypeID) => {
    showDialog({
      width: 520, title: 'Upload a print protocol',
      // Reached from the launcher menu, so the way out of a wrong choice is the menu, not the whole
      // add-on. Nothing is saved until the primary button, so leaving discards what was typed, hence
      // the confirm, which only fires once something has actually been entered.
      btnCancelLabel: '‹ Back to menu', confirmDiscard: true,
      onCancel() { addon.showMainDialog(); },
      content:
        // Printer version (RASTRUM vs Allegro) is NOT asked here, it is detected from the file on
        // parse and shown in the next step. The physical printer (the named machine) is chosen
        // later, at log time, not at protocol upload.
        // Live full-name preview: shows the name that will actually be saved, updating as the label
        // is typed, this replaces any explanatory text, since it demonstrates the auto-added
        // date/version/fingerprint directly. Version + fingerprint fill in once a file is chosen;
        // before that they show as muted placeholder words so the shape is clear.
        `<div class="bpt-stack">${field('Protocol name *', 'inp-name', 'text', 'e.g. Large Plug v2', prefill.name)}<div id="bpt-name-preview-wrap" style="display:none;margin:4px 0 2px;"><div class="bpt-eyebrow">Will be saved as</div><div class="bpt-name" id="bpt-name-preview" style="font-size:14px;"></div></div>${field('.rastrum file *', 'inp-file', 'file', '', undefined, 'accept=".rastrum"')}<div id="bpt-err" class="bpt-error" style="display:none;"></div></div>`,
      afterRender() {
        const fileEl = document.getElementById('inp-file');
        const nameEl = document.getElementById('inp-name');
        const nameWrap = document.getElementById('bpt-name-preview-wrap');
        const namePrev = document.getElementById('bpt-name-preview');
        if (!fileEl) return;
        // Detected once a file is parsed; until then the name preview uses placeholders. No summary
        // card is shown here, Continue leads straight to the full (non-committing) Confirm screen,
        // which already previews everything; a second inline summary would just duplicate it. The
        // background parse below exists ONLY to fill the real version + fingerprint into the name
        // preview before Continue.
        let lastFormat = '', lastHash = '';
        function refreshName() {
          if (!nameEl || !nameWrap || !namePrev) return;
          const label = nameEl.value.trim();
          // Nothing to show until the user starts typing a label.
          if (!label) { nameWrap.style.display = 'none'; return; }
          nameWrap.style.display = 'block';
          // Mirror buildProtocolName's shape: {date}_{version}_{slug}_{hash6}, always joined by "_".
          // The version + fingerprint come from the file, so before one is chosen they show as MUTED
          // placeholder words (not literal characters like "/" or dots, which read as part of the
          // name). Once the file is parsed they are replaced by the real saved values.
          function ph(word) { return `<span style="opacity:.45;font-style:italic;">${word}</span>`; }
          const vHtml = lastFormat ? esc(lastFormat) : ph('version');
          const hHtml = lastHash ? esc(lastHash.slice(0, 6)) : ph('fingerprint');
          namePrev.innerHTML = `${esc(todayISO())}_${vHtml}_${esc(slugify(label))}_${hHtml}`;
        }
        if (nameEl) nameEl.addEventListener('input', refreshName);
        refreshName();
        fileEl.addEventListener('change', () => {
          const f = fileEl.files && fileEl.files[0];
          lastFormat = ''; lastHash = ''; refreshName();
          if (!f) return;
          const reader = new FileReader();
          reader.onload = e => {
            parseRastrum(e.target.result).then(parsed => {
              lastFormat = parsed.format || 'RASTRUM';
              lastHash = parsed.file_hash || '';
              refreshName();
            }).catch(() => { /* a bad file is surfaced with full guidance on Continue */ });
          };
          reader.readAsArrayBuffer(f);
        });
      },
      customButtons: [{ label: 'Continue', fn() {
        const errEl = document.getElementById('bpt-err'); errEl.style.display = 'none';
        const fileEl = document.getElementById('inp-file');
        const file = fileEl && fileEl.files[0];
        const name = val('inp-name');
        if (!file) { errEl.textContent = 'Please choose a .rastrum file.'; errEl.style.display = 'block'; return; }
        if (!name) { errEl.textContent = 'Please enter a protocol name.'; errEl.style.display = 'block'; return; }
        const reader = new FileReader();
        reader.onload = e => {
          parseRastrum(e.target.result)
            .then(parsed => {
              if (!parsed.recognized) {
                showDialog({
                  width: 520, title: '⚠ This file looks different than expected',
                  onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
                  content:
                    '<div>' +
                      '<p style="margin:0 0 10px;">This add-on could not find the details it ' +
                      'normally reads from a print file, like the print model, the plate type, or ' +
                      'the fluids used.</p>' +
                      '<p style="margin:0 0 10px;"><b>This does not mean your print failed.</b> It ' +
                      'usually means the printing software has changed how it saves this file since ' +
                      'this add-on was last updated, and the add-on has not caught up yet.</p>' +
                      '<p style="margin:0 0 10px;"><b>What to do:</b></p>' +
                      '<ul style="margin:0 0 10px;padding-left:20px;">' +
                        '<li><b>Do not rely on "Save anyway"</b> — it would save this protocol with ' +
                        'the details blank, which looks like a real record but is missing information.</li>' +
                        '<li><b>Keep the original file</b> you tried to upload (do not delete it) and ' +
                        '<b>send it to whoever maintains this add-on</b> so it can be updated to read ' +
                        'this new format.</li>' +
                        '<li>Once that is done, you can upload this same file again and it will save ' +
                        'correctly.</li>' +
                      '</ul>' +
                    '</div>',
                  btnCancelLabel: 'Cancel (recommended)',
                  customButtons: [{ label: 'Save anyway (fields will be blank)', fn() {
                    closeModal(); addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name);
                  } }]
                });
                return;
              }
              // Warn if this exact file is already registered, instead of silently duplicating it.
              findProtocolByHash(protocolTypeID, parsed.file_hash).then(existing => {
                if (!existing) { addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name); return; }
                showDialog({
                  width: 480, title: 'This protocol is already registered',
                  onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
                  content: `<p>This exact print file is already in Inventory as <b>${esc(existing.name)}</b> (same file fingerprint).</p><p class="bpt-hint">Uploading it again would create a duplicate protocol. Use the existing one, or save a copy anyway if you really intend a second record.</p>`,
                  btnCancelLabel: 'Back',
                  customButtons: [{ label: 'Save a copy anyway', fn() {
                    closeModal(); addon.confirmProtocol(parsed, name, parsed.format, protocolTypeID, file && file.name);
                  } }]
                });
              });
            })
            .catch(err => { showError('Parse error', `Could not parse the file: ${err.message}`); });
        };
        reader.readAsArrayBuffer(file);
      } }]
    });
  };

  addon.confirmProtocol = (parsed, name, format, protocolTypeID, fileName) => {
    format = format || parsed.format || 'RASTRUM';
    // Format a cells/mL value (or a comma-joined set of them) with thousands separators. Join a set
    // with " · ", NOT a comma, otherwise the separator collides with the thousands commas and
    // "2,000,000, 3,000,000" reads ambiguously (could look like four numbers).
    function fmtConc(v) {
      if (!v) return '';
      return String(v).split(',').map(n => {
        const num = parseInt(String(n).replace(/[^\d]/g, ''), 10);
        return isNaN(num) ? String(n).trim() : num.toLocaleString('en-US');
      }).filter(Boolean).join(' · ');
    }
    // Overview leads with the human-readable science: what material (matrix code), which cells, which
    // plate. The raw fluid codes, print pressures, plate code, and provenance sit under "Technical
    // details" below, so a non-coder sees the meaningful summary first and can expand for the rest.
    function sf(label, valHtml, span2) {
      return `<div class="bpt-sf${span2 ? ' bpt-sf-2' : ''}"><div class="bpt-sf-label">${esc(label)}</div>${valHtml}</div>`;
    }
    function chipRow(str, cls) {
      const parts = String(str || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.length) return '<span class="bpt-sf-val">—</span>';
      return `<div class="bpt-chips">${parts.map(p => `<span class="bpt-chip ${cls}">${esc(p)}</span>`).join('')}</div>`;
    }
    function plainVal(v) { return `<span class="bpt-sf-val">${esc(v)}</span>`; }
    const summaryGrid = `<div class="bpt-summary">${sf('Print model', plainVal(parsed.print_model || '—'))}${sf('Matrix code', parsed.matrix_codes ? chipRow(parsed.matrix_codes, 'bpt-chip-matrix')
  : plainVal(format === 'Allegro' ? '—' : 'Not recorded in RASTRUM files (Allegro only)'))}${sf('Cell line', parsed.cell_line ? chipRow(parsed.cell_line, 'bpt-chip-cell') : plainVal('—'))}${sf('Cell concentration', plainVal(parsed.cell_concentration
  ? `${fmtConc(parsed.cell_concentration)} cells/mL` : '—'))}${sf('Wellplate', plainVal(parsed.wellplate_display || parsed.wellplate || '—'), true)}</div>`;
    const techRows = [
      ['Bioink (fluid)', parsed.fluid_bioink || '-'],
      ['Activator (fluid)', parsed.fluid_cell || '-'],
      ['Inert base bioink', parsed.fluid_bioink_base || '-'],
      ['Inert base activator', parsed.fluid_activator || '-'],
      ['Bioink pressure', `${parsed.pp_bioink.Pressure || '-'} kPa`],
      ['Bioink open time', `${parsed.pp_bioink.OpenTime || '-'} us`],
      ['Activator pressure', `${parsed.pp_cell.Pressure || '-'} kPa`],
      ['Activator open time', `${parsed.pp_cell.OpenTime || '-'} us`],
      ['Wellplate code', parsed.wellplate || '-'],
      ['Schema version', parsed.schema_version || '-'],
      ['Source file', parsed.source_files || '-'],
      ['File hash', parsed.file_hash ? `${parsed.file_hash.slice(0, 16)}…` : '-']
    ].map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
    const fullName = buildProtocolName(name, format, parsed.file_hash);
    // Keep only the facts that matter here: how many plates this file lays out, and whether any wells
    // could not be resolved. The old "Uniform / Structured · N regions" qualifier was dropped, it
    // classified only by model+matrix, so a plate with several cell lines/concentrations still read
    // "Uniform · one printed condition", which was misleading. The plate map below shows the real
    // layout.
    const noteParts = [];
    if (parsed.wellplate_plate_count > 1) {
      noteParts.push(`<b>${esc(parsed.wellplate_plate_count)} plates</b> in this run`);
    }
    if (parsed.wellplate_unresolved_count) {
      noteParts.push(`<b>${esc(parsed.wellplate_unresolved_count)} unresolved</b>`);
    }
    const wellplateNote = (parsed.wellplate_row_count && noteParts.length)
      ? `<p class="bpt-hint" style="margin:14px 0 0;">${noteParts.join(' &nbsp;·&nbsp; ')}</p>`
      : '';
    showDialog({
      width: parsed.wellplate_row_count ? 760 : 580, title: 'Confirm protocol',
      // Going back re-opens the file picker with the name/printer preserved. The file itself can't
      // be restored (browsers block scripts from setting a file input), so it has to be re-chosen.
      onCancel() { closeModal(); addon.showProtocolForm({ name }, protocolTypeID); },
      content:
        // Printer version is detected from the file (not typed). Show it as a badge alongside the
        // uploaded file name so the user can confirm the file was read as the expected generation.
        `<div class="bpt-eyebrow">Protocol name</div><div class="bpt-name">${esc(fullName)}</div><div class="bpt-hint" style="margin:2px 0 10px;"><span class="bpt-chip bpt-chip-cell" style="margin-right:6px;">${esc(format)}</span>${fileName ? `from file <b>${esc(fileName)}</b>` : ''}</div><div class="bpt-speccard">${summaryGrid}</div>${wellplateNote}${parsed.wellplate_row_count
  ? '<details class="bpt-details" open style="margin-top:14px;"><summary>Plate map</summary>' +
    '<div id="bpt-platemap" style="margin-top:12px;"></div></details>'
  : ''}<details class="bpt-details" style="margin-top:20px;border-top:1px solid #eef1f5;padding-top:16px;"><summary>Technical details</summary><table class="bpt-table" style="margin-top:8px;">${techRows}</table></details>`,
      afterRender() {
        if (parsed.wellplate_row_count) {
          renderPlateMapInto(parsed.wellplate_rows, document.getElementById('bpt-platemap'));
        }
      },
      btnCancelLabel: 'Back',
      customButtons: [{ label: 'Save protocol', fn() {
        closeModal();
        // Store the human plate name with the code kept in brackets for traceability.
        const wellplateValue = (parsed.wellplate_display || parsed.wellplate || '') +
          (parsed.wellplate && parsed.wellplate_display ? ` [${parsed.wellplate}]` : '');
        const metas = [
          // Printer VERSION (RASTRUM/Allegro), detected from the file, not the physical machine.
          metaField('Printer version', 'TEXT', format),
          metaField('Print model', 'TEXT', parsed.print_model),
          metaField('Matrix code', 'TEXT', parsed.matrix_codes),
          metaField('Cell line', 'TEXT', parsed.cell_line),
          metaField('Cell concentration (cells/mL)', 'TEXT', parsed.cell_concentration),
          metaField('Wellplate', 'TEXT', wellplateValue),
          metaField('Bioink', 'TEXT', parsed.fluid_bioink),
          metaField('Activator', 'TEXT', parsed.fluid_cell),
          metaField('Inert base bioink', 'TEXT', parsed.fluid_bioink_base),
          metaField('Inert base activator', 'TEXT', parsed.fluid_activator),
          metaField('Bioink pressure (kPa)', 'NUMERIC', parsed.pp_bioink.Pressure),
          metaField('Bioink open time (us)', 'NUMERIC', parsed.pp_bioink.OpenTime),
          metaField('Activator pressure (kPa)', 'NUMERIC', parsed.pp_cell.Pressure),
          metaField('Activator open time (us)', 'NUMERIC', parsed.pp_cell.OpenTime),
          metaField('RASTRUM schema version', 'TEXT', parsed.schema_version),
          metaField('Source file hash', 'TEXT', parsed.file_hash)
          // NB: 'Designed plates (JSON)' is intentionally NOT written here. The attached 'Print file'
          // (raw .rastrum, re-parsed at log time) is the single source of truth, so the denormalised
          // JSON blob would just duplicate it and can go stale. It is written ONLY as a fallback below,
          // when the .rastrum attach fails, see withRaw. Old records that still carry the blob are
          // still read by loadProtocolDetails.
        ];

        // Attach the human-readable protocol PDF, best-effort: a failed upload should not stop the
        // protocol itself from saving. Attaching a FILE meta needs a fileID that only exists once
        // uploaded, so this must happen (and either succeed or be skipped) before the sample create.
        const safeName = fullName.replace(/[^\w.\- ]+/g, '_');
        const withPdf = parsed.pdf_bytes
          ? uploadFile(`${safeName}.pdf`, parsed.pdf_bytes)
              .then(fileID => { metas.push(metaFile('Protocol PDF', fileID)); })
              .catch(err => { console.warn('Bioprint Tracker: PDF attach failed, saving without it:', err); })
          : Promise.resolve();

        // Same best-effort pattern for the well-by-well CSV (Allegro only; see buildAllegroWellplateRows).
        const withCsv = parsed.wellplate_csv ? (() => {
              const enc = new TextEncoder();
              return uploadFile(`${safeName}_wellplate.csv`, enc.encode(parsed.wellplate_csv).buffer)
                .then(fileID => { metas.push(metaFile('Wellplate summary (CSV)', fileID)); })
                .catch(err => { console.warn('Bioprint Tracker: wellplate CSV attach failed, saving without it:', err); });
            })() : Promise.resolve();

        // Attach the raw .rastrum itself, so logging can re-parse it later:
        // the file is the single source of truth, and parser improvements then apply to every existing
        // template without re-upload. The 'Designed plates (JSON)' blob is written ONLY as a fallback
        // here, when there is no raw file to attach, or its upload fails, so the normal case stays
        // free of the big denormalised blob but a layout is never lost.
        const designedBlob = metaField('Designed plates (JSON)', 'TEXT',
          JSON.stringify(parsed.designed_plates || []));
        let withRaw;
        if (parsed.raw_bytes) {
          withRaw = uploadFile(`${safeName}.rastrum`, parsed.raw_bytes)
            .then(fileID => { metas.push(metaFile('Print file', fileID)); })
            .catch(err => {
              console.warn('Bioprint Tracker: .rastrum attach failed; keeping the JSON-blob fallback:', err);
              metas.push(designedBlob);
            });
        } else {
          metas.push(designedBlob); // no raw file available -> the blob is the only layout source
          withRaw = Promise.resolve();
        }

        Promise.all([withPdf, withCsv, withRaw]).then(() => getSampleTypeMetaMap(protocolTypeID).then(map => {
          stampMetaIDs(metas, map);
          return apiCall('POST', 'samples',
            { sampleTypeID: protocolTypeID, name: fullName, sampleMetas: metas });
        })).then(sampleID => {
          // Verify the values actually persisted. eLabNext silently drops a value whose key does not
          // match a field defined on the sample type, so re-read the sample and report any text/numeric
          // field that we sent with a value but that did not come back. This turns today's silent-drop
          // confusion into a clear, actionable message naming the exact fields to add to the type.
          const expectedKeys = metas.filter(m => (m.sampleDataType === 'TEXT' || m.sampleDataType === 'NUMERIC') &&
            m.value != null && m.value !== '').map(m => m.key);
          return getSampleById(sampleID).then(raw => {
            const present = {};
            ((raw && raw.meta) || []).forEach(x => {
              if (x.value != null && x.value !== '') present[x.key] = true;
            });
            const missing = expectedKeys.filter(k => !present[k]);
            if (missing.length) {
              showDialog({ width: 500, title: 'Saved, but some fields did not stick',
                content: `<p>Protocol <b>${esc(fullName)}</b> was created, but ${esc(missing.length)} field value(s) were dropped because the <b>Bioprint Template</b> sample type has no field with exactly these names:</p><ul style="padding-left:20px;margin:8px 0;">${missing.map(k => `<li><code>${esc(k)}</code></li>`).join('')}</ul><p class="bpt-hint">An admin needs to add these as fields on the Bioprint Template sample type (Text), with these exact names, then upload this protocol again.</p>` });
            } else {
              showDialog({ width: 420, title: 'Protocol saved',
                content: `<p>Protocol <b>${esc(fullName)}</b> saved to Inventory, all fields stored.</p>` });
            }
          }).catch(() => {
            // Verification is best-effort; the save itself succeeded.
            showDialog({ width: 420, title: 'Protocol saved',
              content: `<p>Protocol <b>${esc(fullName)}</b> saved to Inventory.</p>` });
          });
        }).catch(err => { showError('Error', `Failed to save protocol: ${err.message}`); });
      } }]
    });
  };

  // ─── Flow 2: log a print run, create N barcoded plate Samples ───────────────
  // Distinct existing values of one field across all plate samples, for the pick-from-existing
  // dropdowns and the "did you mean?" typo guard on Condition / Cell line. Best-effort only: whether
  // the list-samples endpoint returns full sampleMetas or just a summary is unconfirmed; if it
  // doesn't, this quietly yields no suggestions rather than breaking the form.
  // This is the data-quality-by-construction defence: a re-used value is PICKED
  // (byte-identical, no re-typing), and a near-duplicate is caught before it silently splits one
  // value into two. It does NOT enforce a controlled vocabulary, genuinely new values are allowed.
  function distinctMetaValues(plates, key) {
    const set = {};
    // List items (SampleLarge) carry their fields under `meta`, same as the single-sample read.
    (plates || []).forEach(p => {
      (p.meta || []).forEach(m => {
        if (m.key === key && m.value) set[m.value] = true;
      });
    });
    return Object.keys(set).sort();
  }

  // Robust list of samples of one type. The list endpoint's exact filter param and response envelope
  // are not identical across tenants, so this accepts any of the common envelope shapes, then filters
  // client-side by sampleTypeID as a safety net in case the server ignores the query filter and
  // returns everything. It also logs the raw response, so an empty dropdown can be diagnosed from the
  // browser console (look for "Bioprint Tracker: samples list") instead of failing silently.
  // Records what the last list call actually returned, so an empty dropdown can be diagnosed on
  // screen (see showRunForm) without opening the console: the type ID asked for, the envelope shape,
  // how many rows came back, and how many matched the type after filtering.
  const lastListDebug = {};
  function describeEnvelope(resp) {
    if (resp === null) return 'null';
    if (resp === undefined) return 'undefined';
    if (Array.isArray(resp)) return 'array';
    if (typeof resp === 'object') return `object{${Object.keys(resp).slice(0, 8).join(',')}}`;
    return typeof resp;
  }
  function rawSnippet(resp) {
    let s; try { s = JSON.stringify(resp); } catch (e) { s = String(resp); }
    return (s == null ? 'null' : s).slice(0, 240);
  }
  // Per the eLabNext reference (sample_getsamplebyid): GET /samples/{id} returns the sample bare
  // (no data wrapper), and its custom fields are in a `meta` array, NOT `sampleMetas`, which is the
  // WRITE-side name used on POST /samples. Each entry is keyed by `key` (the field display name) with
  // the value in `value`. FILE fields carry `files:[{fileID,...}]`, SAMPLELINK carries `samples:[...]`.
  function metaValueByName(metas, name) {
    const m = (metas || []).filter(x => x.key === name)[0];
    return m && m.value != null ? m.value : '';
  }
  // The fileID stored in a FILE-type meta field (read shape: files:[{fileID,...}]); null if absent.
  function metaFileIdByName(metas, name) {
    const m = (metas || []).filter(x => x.key === name)[0];
    return (m && m.files && m.files[0] && m.files[0].fileID) || null;
  }
  function listSamplesByType(sampleTypeID) {
    // Query params go in the queryParams object (see apiCall). $records=1000 lifts the default page
    // size of 10 so a real list of protocols is not truncated; archived samples are excluded by
    // default. $expand=meta populates each item's field values (needed for the Condition/Cell line
    // autocomplete), which are otherwise returned empty (same behaviour as the single-sample GET).
    return apiCall('GET', 'samples', null, { sampleTypeID, '$records': 1000, '$expand': 'meta' }).then(resp => {
      let list = resp;
      if (resp && Array.isArray(resp.data)) list = resp.data;
      else if (resp && Array.isArray(resp.items)) list = resp.items;
      else if (resp && Array.isArray(resp.results)) list = resp.results;
      else if (resp && Array.isArray(resp.records)) list = resp.records;
      else if (resp && resp.data && Array.isArray(resp.data.items)) list = resp.data.items;
      const envelope = describeEnvelope(resp);
      if (!Array.isArray(list)) {
        console.warn('Bioprint Tracker: unexpected samples list envelope (see object above)', resp);
        lastListDebug[sampleTypeID] = { envelope, rawCount: null, matched: 0, error: null, raw: rawSnippet(resp) };
        return [];
      }
      const rawCount = list.length;
      const matched = list.filter(s => {
        const t = s.sampleTypeID != null ? s.sampleTypeID : (s.sampleType && s.sampleType.sampleTypeID);
        return t == null || String(t) === String(sampleTypeID);
      });
      lastListDebug[sampleTypeID] = { envelope, rawCount, matched: matched.length, error: null, raw: rawSnippet(resp) };
      return matched;
    }).catch(err => {
      console.warn(`Bioprint Tracker: samples list failed for type ${sampleTypeID}`, err);
      lastListDebug[sampleTypeID] = { envelope: null, rawCount: null, matched: 0, error: (err && err.message) || String(err), raw: null };
      return [];
    });
  }

  // ─── Grouped print-run model ──────────────────────────────────────────────────
  // A real print run can be heterogeneous: one physical print from one protocol yields plates that
  // differ in treatment condition. The run form collects a LIST OF GROUPS; each group is a set of
  // plates sharing every field, and expands into `count` barcoded plates.
  //
  // The replicate model:
  //   * ONE print run = ONE biological replicate (one cell prep, one day). It is the Print run ID +
  //     date, and is NOT stored as a number, the biological-replicate ordinal is derived at analysis
  //     time by ordering the runs (by date) that share a Protocol + Condition.
  //   * The duplicate plates WITHIN a run+condition are TECHNICAL replicates, numbered 1..count.
  //   * A plate is NOT tied to an experiment here, it is a shared-Inventory sample, and the user
  //     links it into their own experiment natively afterwards, so one run can
  //     serve several experiments without any per-run experiment field.
  // Run-level (shared by every plate): protocol, cell line, date, reagent lots, Print run ID (no
  // Operator, eLabNext's native owner/creatorID already attributes the record; see below).
  // Per group: condition, technical-replicate count. Grouped entry is a correctness guarantee,
  // not just fewer clicks: plates in one group get byte-identical grouping values by construction,
  // which is exactly what lets replicates find each other by shared VALUES.

  // Levenshtein edit distance, capped at `max`: used only to catch a single-character typo, so it
  // bails out as soon as the distance is certain to exceed the cap (the exact value past that is
  // irrelevant). Classic two-row dynamic-programming table.
  function levenshtein(a, b, max) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = [], j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowBest = i;
      for (j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowBest) rowBest = cur[j];
      }
      if (rowBest > max) return max + 1; // every cell in this row already past the cap
      prev = cur;
    }
    return prev[b.length];
  }

  function normLabel(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  // Replace every run of digits with a single marker, so two labels that differ ONLY in a number
  // (a deliberate sequence like "Project 1" vs "Project 2", or "Drug screen 3" vs "…4") are seen as
  // the same shape and are NOT flagged as typos of each other, only genuinely mistyped text is.
  function digitShape(s) { return normLabel(s).replace(/\d+/g, '#'); }

  // "Did you mean?" guard for a free-text value the user is about to create. Returns the existing
  // value it is most likely a typo OF, or '' when it looks genuinely new (or already matches one
  // exactly). Catches the two ways a re-used label silently splits into a near-duplicate: a
  // case/whitespace-only difference, or a single-character slip on a value long enough that an
  // edit-distance-1 collision is unlikely to be a coincidence (so short, legitimately-distinct
  // labels like "A" vs "B" are never flagged).
  function nearestExisting(value, existing) {
    const v = normLabel(value);
    if (!v) return '';
    const list = existing || [];
    let i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i]) === String(value)) return '';        // already exactly an existing value
    }
    for (i = 0; i < list.length; i++) {
      if (normLabel(list[i]) === v) return list[i];             // differs only in case / whitespace
    }
    if (v.length >= 4) {
      const vShape = digitShape(value);
      for (i = 0; i < list.length; i++) {
        const e = normLabel(list[i]);
        if (digitShape(list[i]) === vShape) continue;   // differs only in a number → a sequence, not a typo
        if (levenshtein(v, e, 1) <= 1) return list[i];   // single-character slip
      }
    }
    return '';
  }

  // Validate a plate's editable fields. Returns a human problem string, or '' if OK. PURE, shared by
  // the wizard's Approve guard and the submit-time backstop so both agree, and unit-tested. Cell line
  // must be present; concentration must be present and a whole number (cells/mL).
  function plateFieldProblem(v) {
    v = v || {};
    if (!v.cell_line) return 'Fill in the cell line before approving this plate.';
    if (!v.concentration) return 'Fill in the concentration before approving this plate.';
    // One or more whole numbers, comma-separated: a plate can hold several concentrations (e.g. a
    // seeding-density plate split into 3), so the field is a set, mirrors the multi-value cell line.
    if (!/^\d+(\s*,\s*\d+)*$/.test(String(v.concentration))) {
      return 'Concentration must be whole number(s) (cells/mL), comma-separated if more than one.';
    }
    return '';
  }

  // Expand a run into the ordered list of plate records to create, ONE record per physical plate
  // the file defines (run.plates). PURE: no DOM, no network, the unit the Node test harness checks.
  // No groups / copies / condition: the .rastrum enumerates every plate, and replicate lineage
  // (technical = same run; biological = same protocol across dates) is DERIVED DOWNSTREAM from these
  // stored facts, not encoded here. Falls back to a single synthesized plate from
  // run-level fields when a protocol carries no designed plates (older record).
  function buildRunPlateSpecs(run) {
    const nm = String(run.protocol_name || '');
    const base = nm.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_[0-9a-f]{6}$/, ''); // protocol name, no date/hash
    const fpMatch = nm.match(/_([0-9a-f]{6})$/);
    const fingerprint = fpMatch ? fpMatch[1] : '';                                    // the design fingerprint
    const plates = (run.plates && run.plates.length) ? run.plates : [{
      plate: '', label: '', cell_line: run.cell_line || '',
      concentration: run.cell_concentration || '', matrix_codes: '', wellplate: ''
    }];
    return plates.map((p, i) => {
      const cellLine = p.cell_line || run.cell_line || '';
      const conc = p.concentration || run.cell_concentration || '';
      const plateId = p.plate || p.label || '';
      // Plate suffix = an ORDINAL in the file's plate order (P1, P2), the same in both formats.
      // It used to be a pass-through of each format's own plate key, which meant different things in
      // each: Allegro supplies a plate ordinal (W1, W2) but classic RASTRUM supplies the wellplate
      // consumable config code (WP001, WP031), so the same position in the name said "which plate" in
      // one format and "which plate type" in the other. WP031 also tells a reader nothing and does not
      // sort by plate order (confirmed in the tenant 2026-07-30: the list put WP031 above WP001). The
      // consumable code is not lost, it has its own `Wellplate` field. Taken from the label ("Plate 2")
      // so it stays the file's ordinal when only some plates are logged, falling back to position.
      const labelOrdinal = String(p.label || '').match(/(\d+)/);
      const ordinal = labelOrdinal ? parseInt(labelOrdinal[1], 10) : (i + 1);
      // Only a plate with an identity of its own is numbered. A run synthesized without plates (the
      // fallback above, and older callers) has none, and stays suffix-free rather than gaining "_P1".
      const plateTag = plateId ? `P${ordinal}` : '';
      // Name = intrinsic, stable facts only (no derived rep number): date_cellline_protocol_fp_plate.
      // The barcode is the true unique key; the name is for human recognition in sample lists.
      const name = [run.date, slugify(cellLine), base, fingerprint, plateTag]
        .filter(Boolean).join('_');
      const metas = [
        metaLink('Bioprint Template', parseInt(run.protocol_id, 10)),
        metaField('Cell line', 'TEXT', cellLine),
        // TEXT (not NUMERIC): a plate can carry several concentrations (seeding-density plates), so
        // the value is a comma-separated set like "2000000, 3000000, 5000000". Numeric analysis is
        // done downstream (parses the set); the sample-type field must be Text to hold it.
        metaField('Cell concentration (cells/mL)', 'TEXT', conc),
        // No "Operator" field: eLabNext already attributes every sample to the logged-in user who
        // created it (native `owner`/`creatorID`, read back after create). Logins are personal here,
        // so that native attribution is a strictly better source than a free-typed name, no typing,
        // no risk of "Phil" vs "Philipp G." splitting one person into two labels.
        // Physical printer (machine) this plate was printed on, chosen at log time.
        metaField('Printer', 'TEXT', run.printer),
        metaField('Print date', 'DATE', run.date),
        metaField('Print run ID', 'TEXT', run.print_run_id),
        metaField('Bioink lot', 'TEXT', run.lot_bioink),
        metaField('Activator lot', 'TEXT', run.lot_cell)
        // No Condition / Experiment / Replicate fields: treatment and replicate lineage are derived
        // downstream from the facts below, not stored on the plate.
      ];
      if (p.matrix_codes) metas.push(metaField('Matrix code', 'TEXT', p.matrix_codes));
      if (p.wellplate) metas.push(metaField('Wellplate', 'TEXT', p.wellplate));
      // Passage: TEXT (not NUMERIC) because a multi-cell-line plate carries one per cell line as a
      // comma-joined set (e.g. "12, 8"), the same shape as cell line / concentration. Optional.
      if (p.passage) metas.push(metaField('Passage number', 'TEXT', p.passage));
      if (plateId) metas.push(metaField('Plate', 'TEXT', plateId));
      // The inert base is often printed on a separate day; record it when given (optional).
      if (run.date_inert_base) metas.push(metaField('Inert base print date', 'DATE', run.date_inert_base));
      return {
        plate_label: p.label || plateId || '',
        plate_id: plateId,
        cell_line: cellLine,
        concentration: conc,
        passage: p.passage || '',
        matrix: p.matrix_codes || '',
        wellplate: p.wellplate || '',
        // Native Notes on the plate = this plate's own note (notes are per-plate; no run-level note).
        // run.notes is still honoured as a fallback for a synthesized plate / older callers.
        note: p.note || run.notes || '',
        name,
        metas
      };
    });
  }

  addon.showRunDialog = () => {
    Promise.all([
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PLATE, 'Bioprinted Plate'),
      resolveSampleTypeID(CONFIG.SAMPLE_TYPE_PROTOCOL, 'Bioprint Template')
    ]).then(ids => {
      const plateTypeID = ids[0], protocolTypeID = ids[1];
      return Promise.all([
        listSamplesByType(protocolTypeID),
        listSamplesByType(plateTypeID)
      ]).then(resps => {
        const protocols = resps[0], plates = resps[1];
        addon.showRunForm(protocols, plateTypeID, {
          cellLines: distinctMetaValues(plates, 'Cell line'),
          printers: distinctMetaValues(plates, 'Printer')
        }, protocolTypeID);
      });
    }).catch(err => { showError('Not set up yet', err.message); });
  };

  addon.showRunForm = (protocols, plateTypeID, existing, protocolTypeID) => {
    existing = existing || {};
    const cellLineValues = existing.cellLines || [];
    // Physical printers used before (never hard-coded, the list
    // learns itself from prior plate records, so it stays general for any lab). Offered as datalist
    // suggestions; the first use is typed, afterwards it is one click.
    const printerValues = existing.printers || [];
    // The protocol picker is a searchable combobox built in afterRender from `protocols`. The
    // Condition / Cell line datalists offer previously-used values, so a re-used label is picked
    // rather than retyped (byte-identical); see distinctMetaValues / nearestExisting.
    function optionsFor(values) {
      return (values || []).map(e => `<option value="${esc(e)}">`).join('');
    }
    // In multi-plate wizard mode, afterRender sets this to a collector that returns one entry per
    // physical plate. Declared in the form scope so both afterRender and the submit button see it;
    // `platesAllApproved` is the companion bridge letting the submit button check the approval state
    // that lives inside afterRender's per-plate wizard.
    let collectPlateGroups = null;
    let platesAllApproved = () => false;
    // Which plates are still unapproved (1-based, in file order), and a jump to a given one. The
    // submit button needs both: naming the plates that are blocking is more use than "approve every
    // plate", and landing the user on the first one saves them hunting for it.
    let unapprovedPlateNumbers = () => [];
    let goToPlate = () => {};

    // When no protocols came back, show exactly what the list call returned so the cause is visible
    // without the console: wrong type ID, an envelope we didn't parse, or an API error.
    const dbg = lastListDebug[protocolTypeID] || {};
    let emptyNote = '';
    if (!protocols.length) {
      const detail = dbg.error
        ? `the list request failed with: ${esc(dbg.error)}`
        : `the request returned ${dbg.rawCount == null ? `an unrecognised response, shape ${esc(dbg.envelope)}` :
      `${esc(dbg.rawCount)} sample(s), ${esc(dbg.matched)} of them of this type`}`;
      emptyNote = `<div class="bpt-error" style="margin-bottom:2px;">No protocols found for sample type ID <b>${esc(protocolTypeID)}</b>. ${detail}.${dbg.raw ? `<br><span style="font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;">raw: ${esc(dbg.raw)}</span>` : ''}<br>Send me this whole message and we will fix the lookup.</div>`;
    }
    showDialog({
      // Broad so a 384-well plate map and the two-column fields sit comfortably (capped at 90vw by
      // the modal, so it still fits smaller screens).
      width: 860, title: 'Log a print run',
      btnCancelLabel: '‹ Back to menu', confirmDiscard: true,
      onCancel() { addon.showMainDialog(); },
      content:
        // Collapsed by default (no `open`) so it stays out of the way; click to expand. Pulled up
        // (negative margin on the wrapper, AND margin-top:0 on the <details> itself, the shared
        // .bpt-details class carries its own 10px top margin that otherwise cancels the wrapper's
        // pull-up) so it reads as attached to the Protocol field above, not floating at the same
        // distance as the run-level fields below it. No divider here: a rule line this close to two
        // small elements read as clutter rather than a clear section break; the tightened spacing
        // above and the normal gap below are enough to group it with Protocol on their own.
        // Run-level fields (shared by every plate). Cell line and concentration are NOT here, they
        // are per-plate, set in the review step below (pre-filled from the file/protocol). No
        // Operator field: eLabNext already attributes the created records to the logged-in user
        // (native owner/creatorID), so nothing needs typing here, see buildRunPlateSpecs. Printer
        // takes the first slot alone (the row's second cell is deliberately left blank rather than
        // forcing an artificial pairing); it is the physical machine (the named unit) chosen at log
        // time, distinct from the protocol's printer VERSION. Suggestions come from previously-used
        // printers (printerValues), new ones allowed.
        // Default the (cell/model) print date to today; the user can still change it.
        // The inert base is often printed on a separate, earlier day (optional; blank = same run).
        // Reagent lots: a run can use more than one bioink / activator lot, so each is a repeatable
        // list with an "add" button (see afterRender). Values are joined on submit.
        // Divider: everything above is run-level (shared); below is the per-plate review.
        // Per-plate review: one step per physical plate the file defines. Each is approved (with its
        // cell line + concentration) before the run can be created. See renderPlateArea. Notes are
        // captured PER PLATE inside each step (no separate run-level notes field).
        `<div class="bpt-stack">${emptyNote}<div class="bpt-field bpt-combo"><label>Bioprint Template *</label><input id="inp-protocol-search" type="text" autocomplete="off" placeholder="Type to search protocols…"><input type="hidden" id="inp-protocol"><div id="bpt-protocol-list" class="bpt-combo-list" style="display:none;"></div></div><div id="bpt-protocol-details" style="display:none;margin-top:-10px;"><details class="bpt-details" style="margin-top:0;"><summary>Bioprint Template details</summary><table class="bpt-table" id="bpt-protocol-details-table" style="margin-top:6px;"></table></details></div><div class="bpt-grid2"><div class="bpt-field"><label>Printer *</label><input class="bpt-inp" id="inp-printer-machine" type="text" list="bpt-printer-list" autocomplete="off" placeholder="e.g. your printer name"><div class="bpt-dym bpt-printer-dym" style="display:none;"></div></div></div><div class="bpt-grid2">${field('Date of print *', 'inp-date', 'date', '', todayISO())}<div class="bpt-field"><label>Inert base print date</label><input class="bpt-inp" id="inp-date-inert" type="date"></div></div><div class="bpt-grid2"><div class="bpt-field"><label>Bioink lot</label><div id="bpt-lots-bioink" class="bpt-lots"></div><button type="button" class="bpt-lot-add" data-lots="bioink">+ Add bioink lot</button></div><div class="bpt-field"><label>Activator lot</label><div id="bpt-lots-activator" class="bpt-lots"></div><button type="button" class="bpt-lot-add" data-lots="activator">+ Add activator lot</button></div></div><hr class="bpt-hr"><div class="bpt-field"><label class="bpt-section">Plates in this run *</label><div id="bpt-plate-area"></div></div><datalist id="bpt-cellline-list">${optionsFor(cellLineValues)}</datalist><datalist id="bpt-printer-list">${optionsFor(printerValues)}</datalist><div id="bpt-err" class="bpt-error" style="display:none;"></div></div>`,
      afterRender() {
        const searchEl = document.getElementById('inp-protocol-search');
        const hiddenEl = document.getElementById('inp-protocol');
        const listEl = document.getElementById('bpt-protocol-list');

        // Newest first, protocol names begin with the ISO date, so a descending sort does it.
        const sorted = (protocols || []).slice().sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        // Each row shows the parsed science (cell line, matrix, plate) under the name, so the right
        // protocol is recognised by its contents rather than by decoding the auto-generated name.
        function subtitle(p) {
          return [metaValueByName(p.meta, 'Cell line'), metaValueByName(p.meta, 'Matrix code'),
            metaValueByName(p.meta, 'Wellplate')].filter(Boolean).join(' · ');
        }
        function renderList(q) {
          q = String(q || '').trim().toLowerCase();
          const items = sorted.filter(p => {
            if (!q) return true;
            return (`${String(p.name || '')} ${subtitle(p)}`).toLowerCase().indexOf(q) !== -1;
          });
          if (!items.length) { listEl.innerHTML = '<div class="bpt-combo-empty">No protocol matches.</div>'; return; }
          listEl.innerHTML = items.map(p => {
            const id = p.sampleID != null ? p.sampleID : p.id;
            const sub = subtitle(p);
            return `<div class="bpt-combo-item" data-id="${esc(id)}" data-name="${esc(p.name || '')}"><div class="nm">${esc(p.name || (`sample ${id}`))}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`;
          }).join('');
          Array.prototype.forEach.call(listEl.querySelectorAll('.bpt-combo-item'), el => {
            el.onclick = () => { choose(el.getAttribute('data-id'), el.getAttribute('data-name')); };
          });
        }
        function choose(id, nm) {
          markDialogDirty();   // picking a protocol is real work, but it fires no input/change event
          hiddenEl.value = id;
          hiddenEl.setAttribute('data-name', nm);
          searchEl.value = nm;
          listEl.style.display = 'none';
          loadProtocolDetails(id);
        }
        searchEl.onfocus = () => { renderList(searchEl.value); listEl.style.display = 'block'; };
        searchEl.oninput = () => {
          hiddenEl.value = ''; // typing invalidates the previous pick until one is chosen again
          renderList(searchEl.value); listEl.style.display = 'block';
        };
        // Close the list on a click outside the combo. Bound to the overlay so it dies with the modal.
        const overlay = document.getElementById('bpt-modal-overlay');
        if (overlay) overlay.addEventListener('mousedown', e => {
          const combo = searchEl.parentNode;
          if (combo && !combo.contains(e.target)) listEl.style.display = 'none';
        });

        // Reagent lots: start each list with one input; "+ Add" appends another so a run can record
        // several bioink / activator lots. Read back on submit via the .bpt-lot-<kind> class.
        function addLotInput(kind, focus) {
          const wrap = document.getElementById(`bpt-lots-${kind}`);
          if (!wrap) return;
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = `bpt-inp bpt-lot-${kind}`;
          inp.placeholder = kind === 'bioink' ? 'e.g. INK1042' : 'e.g. INK2091';
          wrap.appendChild(inp);
          if (focus) inp.focus();
        }
        addLotInput('bioink'); addLotInput('activator');
        Array.prototype.forEach.call(document.querySelectorAll('.bpt-lot-add'), b => {
          b.onclick = () => { addLotInput(b.getAttribute('data-lots'), true); };
        });

        // Printer gets the same "did you mean?" guard as Cell line (attachDidYouMean, defined below -
        // a hoisted function declaration, so calling it here is safe). Checked against previously-used
        // printer names only (printerValues, self-learning, never a hardcoded list), so a genuinely
        // new printer is always allowed; only a near-duplicate of one already logged is flagged. This
        // matters because Printer is a join/grouping label in the analysis CSV: "Kahlo" and "Kaloh"
        // (or a case/whitespace slip) would otherwise silently split one machine into two labels.
        const printerEl = document.getElementById('inp-printer-machine');
        const printerDymEl = document.querySelector('.bpt-printer-dym');
        if (printerEl && printerDymEl) attachDidYouMean(printerEl, printerValues, printerDymEl);

        // Loads the selected template's recorded fields into the read-only "Bioprint Template details" section
        // and pre-fills cell line + concentration (both parsed from the file), editable.
        function loadProtocolDetails(id) {
          const detailsWrap = document.getElementById('bpt-protocol-details');
          const table = document.getElementById('bpt-protocol-details-table');
          if (!id) { detailsWrap.style.display = 'none'; return; }
          table.innerHTML = '<tr><td colspan="2">Loading…</td></tr>';
          detailsWrap.style.display = 'block';
          // $expand=meta is REQUIRED to get field values (confirmed in the eLabNext docs); without it
          // the meta array comes back empty.
          getSampleById(id).then(raw => {
            const metas = (raw && raw.meta) || [];
            function get(key) { return metaValueByName(metas, key); }
            const rows = [
              ['Print model', get('Print model')],
              ['Matrix code', get('Matrix code')],
              ['Cell line', get('Cell line')],
              ['Cell concentration (cells/mL)', get('Cell concentration (cells/mL)')],
              ['Wellplate', get('Wellplate')],
              ['Bioink', get('Bioink')], ['Activator', get('Activator')]
            ].filter(r => r[1]).map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
            table.innerHTML = rows || ('<tr><td colspan="2" class="bpt-hint">This protocol has no stored ' +
              'details. It may be an older record saved before the fields were set up. Try a newer protocol.</td></tr>');
            // Protocol-level defaults used to pre-fill each plate's editable fields when the plate
            // itself doesn't carry them (cell line / concentration are per-plate, but the protocol's
            // value is the sensible starting point). Concentration keeps only the first number.
            protoDefaults = {
              cell_line: get('Cell line') || '',
              concentration: String(get('Cell concentration (cells/mL)') || '').split(',')[0].replace(/[^\d]/g, '')
            };
            // Designed plates for the wizard. PREFER re-parsing the attached .rastrum (single source of
            // truth, parser improvements apply to old templates too). Fall back to the
            // cached "Designed plates (JSON)" blob for older templates that have no attached file, or if
            // the download/parse fails.
            function renderFromBlob() {
              let designed = [];
              const dpRaw = get('Designed plates (JSON)');
              if (dpRaw) {
                try {
                  designed = JSON.parse(dpRaw) || [];
                } catch (e) {
                  document.getElementById('bpt-plate-area').innerHTML =
                    '<div class="bpt-error">This protocol’s stored plate layout is unreadable ' +
                    '(corrupt "Designed plates" data). Re-upload the .rastrum to fix it.</div>';
                  return;
                }
              }
              renderPlateArea(designed);
            }
            const printFileID = metaFileIdByName(metas, 'Print file');
            if (printFileID) {
              document.getElementById('bpt-plate-area').innerHTML =
                '<div class="bpt-hint" style="font-size:12.5px;">Reading the plate layout from the print file…</div>';
              fetchFileBytes(printFileID)
                .then(buf => parseRastrum(buf))
                .then(reparsed => { renderPlateArea(reparsed.designed_plates || []); })
                .catch(err => {
                  // Attached-file path failed, fall back to the cached blob rather than blocking.
                  console.warn('Bioprint Tracker: re-parse of attached .rastrum failed, using cached layout:', err);
                  renderFromBlob();
                });
            } else {
              renderFromBlob();  // older template: no attached .rastrum
            }
          }).catch(err => {
            // Surface the real error instead of swallowing it, otherwise submit later fails with a
            // misleading "choose a protocol" message.
            table.innerHTML = `<tr><td colspan="2" class="bpt-error">Could not load this protocol: ${esc((err && err.message) || String(err))}</td></tr>`;
            document.getElementById('bpt-plate-area').innerHTML =
              `<div class="bpt-error">Could not load the protocol’s plates: ${esc((err && err.message) || String(err))}. Try again or pick another protocol.</div>`;
          });
        }

        // Inline "did you mean?" for one input against a set of existing values (the typo guard the
        // dropdowns cannot cover, since a user can still type a near-duplicate). Clicking the
        // suggestion fills the field with the exact existing value, so replicates group together.
        function attachDidYouMean(input, existingValues, hintEl) {
          input.addEventListener('blur', () => {
            const s = nearestExisting(input.value, existingValues);
            if (!s) { hintEl.style.display = 'none'; hintEl.innerHTML = ''; return; }
            hintEl.style.display = 'block';
            hintEl.innerHTML = `Did you mean <a>${esc(s)}</a>? A very similar value already exists — reuse it so records group together.`;
            hintEl.querySelector('a').onclick = () => {
              input.value = s; hintEl.style.display = 'none'; hintEl.innerHTML = '';
            };
          });
        }

        // ── Per-plate review & approve ────────────────────────────────────────────────
        // One step per physical plate the file defines (single- and multi-plate use the SAME flow).
        // Each step shows the plate map + the LOCKED facts (wellplate, matrix) and the two EDITABLE,
        // pre-filled facts (cell line, concentration). A plate must be Approved before the run can be
        // created; a plate with a blank cell line or concentration cannot be approved.
        let protoDefaults = { cell_line: '', concentration: '' }; // set by loadProtocolDetails
        const wiz = { plates: [], step: 0, edits: {}, approved: {} };
        function rehydrate(rows) {
          return (rows || []).map(r => ({
            wellRange: r.wr,
            model: r.m,
            matrix_codes: r.mx,
            cells: r.c
          }));
        }
        function plateKey(p) { return p.plate || p.label || ''; }
        function readPlateForm() {
          const area = document.getElementById('bpt-plate-area');
          const cl = area.querySelector('.bpt-pl-cellline');
          const cc = area.querySelector('.bpt-pl-conc');
          const pa = area.querySelector('.bpt-pl-passage');
          const nt = area.querySelector('.bpt-pl-note');
          return {
            cell_line: cl ? cl.value.trim() : '',
            concentration: cc ? cc.value.trim() : '',
            passage: pa ? pa.value.trim() : '',
            note: nt ? nt.value.trim() : ''
          };
        }
        function saveCurrentStep() {
          if (!wiz.plates.length) return;
          wiz.edits[plateKey(wiz.plates[wiz.step])] = readPlateForm();
        }
        // Effective values for a plate: the user's edit if present, else the plate's own file value,
        // else the protocol default.
        function plateVals(p) {
          const e = wiz.edits[plateKey(p)] || {};
          return {
            cell_line: e.cell_line != null ? e.cell_line : (p.cell_line || protoDefaults.cell_line || ''),
            concentration: e.concentration != null ? e.concentration : (p.concentration || protoDefaults.concentration || ''),
            // Passage has no file/protocol source, user-entered only, so it defaults to blank.
            passage: e.passage != null ? e.passage : '',
            note: e.note != null ? e.note : (p.note || '')
          };
        }
        function updateStatus() {
          const el = document.getElementById('bpt-wiz-status');
          if (!el) return;
          const n = wiz.plates.filter(p => wiz.approved[plateKey(p)]).length;
          const total = wiz.plates.length;
          el.textContent = (n === total)
            ? `All ${total} plate${total === 1 ? '' : 's'} approved — you can create the records.`
            : `${n} of ${total} plate${total === 1 ? '' : 's'} approved.`;
        }
        function renderStep(i) {
          const plates = wiz.plates, plate = plates[i], key = plateKey(plate);
          wiz.step = i;
          const v = plateVals(plate);
          // Approving FREEZES the plate: an approved plate whose fields are still live means the
          // badge is a claim about content that can keep moving, and passage/note edits used to slip
          // past the old un-approve-on-edit listeners entirely. Frozen, "approved" means exactly
          // "this content is what will be created". Reopening is one click on the same button.
          const isApproved = !!wiz.approved[key];
          const ro = isApproved ? ' disabled' : '';
          const locked = [shortWellplate(plate.wellplate), plate.matrix_codes].filter(Boolean).join(' · ');
          // Dots double as a jump target: with more than two or three plates, stepping through with
          // Back/Next to reach one plate is tedious. title= names the plate for a screen reader and
          // on hover, since a dot alone says nothing.
          const dots = plates.map((p, j) => {
            const done = !!wiz.approved[plateKey(p)];
            return `<button type="button" class="bpt-wiz-dotbtn" data-bpt-step="${j}" title="Plate ${j + 1}${done ? ' (approved)' : ' (not approved yet)'}" aria-label="Go to plate ${j + 1}${done ? ', approved' : ', not approved yet'}"><span class="bpt-wiz-dot${j === i ? ' active' : ''}${done ? ' done' : ''}"></span></button>`;
          }).join('');
          document.getElementById('bpt-plate-area').innerHTML =
            // type="text" + inputmode=numeric instead of type="number": the eLabNext host
            // stylesheet forces input[type=number] to a fixed narrow width (even over an inline
            // width), and it clips the value. A text input with numeric inputmode keeps the phone
            // keypad / numeric intent without the host's number-input sizing, and takes width:100%.
            // Passage is optional and NOT in the print file (the printer doesn't know it), entered
            // here per plate. Like cell line / concentration it can be multi-valued: one per cell
            // line, comma-separated in the SAME order, so "Cell A, Cell B" at p12/p8 -> "12, 8".
            `<div class="bpt-wiz-head"><span class="bpt-wiz-title">Plate ${i + 1} of ${plates.length}${plate.plate ? ` · ${esc(plate.plate)}` : ''}</span>${locked ? `<span class="bpt-wiz-sub">${esc(locked)}</span>` : ''}</div><div class="bpt-wiz-map" id="bpt-wiz-map"></div><div class="bpt-plate-form"><div class="bpt-field"><label>Cell line *</label><input class="bpt-inp bpt-pl-cellline" type="text" list="bpt-cellline-list" placeholder="e.g. MDA-MB-231" value="${esc(v.cell_line)}"${ro}></div><div class="bpt-field"><label>Concentration (cells/mL) *</label><input class="bpt-inp bpt-pl-conc" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 9400000" value="${esc(v.concentration)}"${ro}></div><div class="bpt-field bpt-sf-2"><label>Passage number</label><input class="bpt-inp bpt-pl-passage" type="text" placeholder="e.g. 12  (or 12, 8, 20 — one per cell line, same order)" value="${esc(v.passage)}"${ro}></div></div><div class="bpt-dym bpt-pl-dym" style="display:none;"></div><div class="bpt-field" style="margin-top:10px;"><label>Plate note</label><textarea class="bpt-inp bpt-pl-note" rows="2" placeholder="anything specific to THIS plate, e.g. nozzle 3 clogged"${ro}>${esc(v.note)}</textarea></div><div class="bpt-wiz-nav"><button type="button" class="bpt-wiz-btn" id="bpt-wiz-prev"${i === 0 ? ' disabled' : ''}>‹ Previous plate</button><div class="bpt-wiz-dots">${dots}</div><button type="button" class="bpt-wiz-btn" id="bpt-wiz-next"${i === plates.length - 1 ? ' disabled' : ''}>Next plate ›</button></div><div class="bpt-wiz-approve-row"><button type="button" class="bpt-wiz-btn bpt-wiz-approve${isApproved ? ' done' : ''}" id="bpt-wiz-approve">${isApproved ? '✓ Approved — click to edit' : 'Approve plate'}</button></div>${isApproved ? '<p class="bpt-wiz-status" style="margin-top:6px;">This plate’s fields are locked while it is approved. Click <b>✓ Approved</b> above to change them.</p>' : ''}<div class="bpt-wiz-status" id="bpt-wiz-status"></div>`;
          renderPlateMapInto(rehydrate(plate.rows), document.getElementById('bpt-wiz-map'));
          // Suggestions are pointless on a frozen field, so they are only wired while editable.
          if (!isApproved) {
            attachDidYouMean(document.querySelector('#bpt-plate-area .bpt-pl-cellline'),
              cellLineValues, document.querySelector('#bpt-plate-area .bpt-pl-dym'));
          }
          // Moving between plates and approving a plate are SEPARATE actions. Approving used to be
          // the only thing that advanced, while an approved plate's button un-approved instead of
          // advancing, so returning to an earlier plate left no way forward except withdrawing and
          // re-granting approval. Navigation now never changes approval, and approving never
          // navigates. Every move saves the current fields first, so nothing typed is lost.
          function goTo(j) {
            if (j < 0 || j >= plates.length || j === wiz.step) return;
            saveCurrentStep();
            renderStep(j);
          }
          document.getElementById('bpt-wiz-prev').onclick = () => { goTo(wiz.step - 1); };
          document.getElementById('bpt-wiz-next').onclick = () => { goTo(wiz.step + 1); };
          // The button handles Enter/Space itself, so no key handling is needed here.
          const dotEls = document.querySelectorAll('#bpt-plate-area [data-bpt-step]');
          Array.prototype.forEach.call(dotEls, d => {
            const j = parseInt(d.getAttribute('data-bpt-step'), 10);
            d.onclick = () => { goTo(j); };
          });
          // Approving stays on the current plate. An already-approved plate un-approves on click, so
          // withdrawing approval is deliberate rather than a side effect of trying to move.
          document.getElementById('bpt-wiz-approve').onclick = () => {
            if (wiz.approved[key]) { wiz.approved[key] = false; renderStep(wiz.step); return; }
            saveCurrentStep();
            const e = wiz.edits[key] || {};
            const st = document.getElementById('bpt-wiz-status');
            const problem = plateFieldProblem(e);
            if (problem) { if (st) st.textContent = problem; return; }
            wiz.approved[key] = true;
            renderStep(wiz.step);
          };
          updateStatus();
        }
        function renderPlateArea(designedPlates) {
          const plates = (designedPlates && designedPlates.length) ? designedPlates : [{
            plate: '', label: 'Plate 1', wellplate: '', cell_line: '', matrix_codes: '', rows: []
          }];
          wiz.plates = plates; wiz.step = 0; wiz.edits = {}; wiz.approved = {};
          // Bridge to the submit button: one plate record per designed plate, plus the approval check.
          collectPlateGroups = () => {
            saveCurrentStep();
            return wiz.plates.map(p => {
              const v = plateVals(p);
              return {
                plate: plateKey(p), label: p.label || '',
                cell_line: v.cell_line, concentration: v.concentration, passage: v.passage, note: v.note,
                matrix_codes: p.matrix_codes || '', wellplate: p.wellplate || ''
              };
            });
          };
          platesAllApproved = () => wiz.plates.length > 0 && wiz.plates.every(p => wiz.approved[plateKey(p)]);
          unapprovedPlateNumbers = () => wiz.plates
            .map((p, j) => (wiz.approved[plateKey(p)] ? 0 : j + 1))
            .filter(Boolean);
          goToPlate = n => {
            const j = n - 1;
            if (j >= 0 && j < wiz.plates.length && j !== wiz.step) { saveCurrentStep(); renderStep(j); }
          };
          renderStep(0);
        }

        // Nothing until a protocol is chosen.
        document.getElementById('bpt-plate-area').innerHTML =
          '<div class="bpt-hint" style="font-size:12.5px;">Choose a protocol above to see its plates.</div>';
      },
      customButtons: [{ label: 'Create plate records', fn() {
        const errEl = document.getElementById('bpt-err'); errEl.style.display = 'none';
        // Scrolled into view because the message sits at the foot of a long form: without this the
        // button appears to do nothing when the reason is below the fold. Guarded, since not every
        // environment implements scrollIntoView.
        function fail(msg) {
          errEl.textContent = msg;
          errEl.style.display = 'block';
          if (typeof errEl.scrollIntoView === 'function') errEl.scrollIntoView({ block: 'nearest' });
        }
        const protoEl = document.getElementById('inp-protocol');
        // Collect the (possibly several) reagent lots straight from the DOM, joined into one value.
        function lots(kind) {
          return Array.prototype.map.call(document.querySelectorAll(`.bpt-lot-${kind}`), i => i.value.trim()).filter(Boolean).join(', ');
        }
        // One record per physical plate, from the per-plate review step (each carries its own cell
        // line + concentration). Every plate must be approved before we create anything.
        const plates = collectPlateGroups ? collectPlateGroups() : null;
        const run = {
          plate_type_id: plateTypeID,
          protocol_id: protoEl.value,
          protocol_name: protoEl.getAttribute('data-name') || '',
          date: val('inp-date'),
          printer: val('inp-printer-machine'),
          date_inert_base: val('inp-date-inert'),
          lot_bioink: lots('bioink'), lot_cell: lots('activator'),
          print_run_id: makePrintRunID(), // notes are per-plate now (set in each plate's step)
          plates: plates || []
        };
        if (!run.protocol_id) return fail('Please select a protocol.');
        if (!plates || !plates.length) return fail('Choose a protocol so its plates load.');
        if (!run.printer) return fail('Printer is required.');
        if (!run.date) return fail('Date is required.');
        if (!platesAllApproved()) {
          // Name what is blocking rather than restating the rule, and land the user on the first
          // plate that needs attention so they do not have to find it.
          const pending = unapprovedPlateNumbers();
          const which = pending.length === 1
            ? `Plate ${pending[0]} has not been approved yet`
            : `Plates ${listPhrase(pending)} have not been approved yet`;
          const of = ` (${pending.length} of ${plates.length} still to approve).`;
          if (pending.length) goToPlate(pending[0]);
          return fail(`Nothing was created. ${which}${of} Check its cell line and concentration, ` +
            'then press Approve plate. Every plate has to be approved before the records are made.');
        }
        // Backstop: re-validate the LIVE values, not just the approval flags, so a plate that was
        // approved then edited to a blank/invalid value can never be created.
        for (let pi = 0; pi < plates.length; pi++) {
          const prob = plateFieldProblem(plates[pi]);
          if (prob) return fail(`Plate ${pi + 1}${plates[pi].plate ? ` (${plates[pi].plate})` : ''}: ${prob}`);
        }
        addon.createPlates(run);
      } }]
    });
  };

  // Copy text to the clipboard, with a fallback for contexts where the async Clipboard API is
  // blocked (some sandboxed iframes). Resolves to true/false so the UI can show feedback.
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  // One CSV row per created plate: the barcode (the join key the drive files match on) plus the key
  // facts. This is the hand-off to the analysis layer outside eLabNext, where replicate lineage is
  // reconstructed from these facts. PURE (unit-tested); `results` are the created-plate objects.
  function plateRecordsCSV(results, run, shortName) {
    const header = ['Barcode', 'Sample name', 'Plate', 'Cell line', 'Concentration (cells/mL)',
      'Passage number', 'Matrix code', 'Wellplate', 'Printer', 'Protocol', 'Print run ID', 'Print date',
      'Inert base print date', 'Operator', 'Bioink lot', 'Activator lot'];
    const lines = [header.map(csvEscape).join(',')];
    (results || []).forEach(r => {
      const s = r.spec || {};
      let code = r.barcode || (r.sampleID != null ? `id ${r.sampleID}` : '');
      // Excel mangles a long ALL-DIGIT barcode into scientific notation (e.g. 5.00001E+12). Wrap only
      // those as an Excel text-literal (="…"); leave alphanumeric barcodes / "id 123" plain so
      // programmatic consumers (pandas/R, the analysis join key) read a clean value, not `="…"`.
      if (/^\d+$/.test(code)) code = `="${code}"`;
      // "Operator" is the sample's native eLabNext owner (read back per-record after creation), not a
      // typed value, see createPlates. Kept as its own column per record rather than a single
      // run-level value, since in principle each plate could carry a different creator.
      const cells = [code, s.name, s.plate_id, s.cell_line, s.concentration, s.passage, s.matrix,
        s.wellplate, run.printer, shortName, run.print_run_id, run.date, run.date_inert_base,
        r.owner || '', run.lot_bioink, run.lot_cell];
      // Cell 0 is the barcode (already made Excel-safe above); formula-guard the rest so a value
      // starting with = + - @ cannot execute when the CSV is opened in a spreadsheet.
      lines.push(cells.map((v, i) => csvEscape(i === 0 ? String(v == null ? '' : v) : csvFormulaGuard(v))).join(','));
    });
    return lines.join('\r\n');
  }
  // Trigger a client-side download of text (the CSV). Best-effort: some sandboxed add-on iframes may
  // block it, in which case the "Copy all barcodes" button remains as a fallback.
  function downloadText(filename, text) {
    try {
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      return true;
    } catch (e) { return false; }
  }

  addon.createPlates = run => {
    closeModal();
    // Build the ordered list of plate records (pure; unit-tested). Each spec already carries its
    // name, note, and the full sampleMetas array.
    const specs = buildRunPlateSpecs(run);
    showDialog({ width: 420, title: 'Creating plates',
      content: `<p>Creating ${esc(specs.length)} plate record(s)…</p>` });

    // Strip the auto-generated date prefix and hash suffix (see buildProtocolName) back off the
    // protocol's name, so the summary reads as a clean human label rather than repeating them.
    const shortName = String(run.protocol_name || '')
      .replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_[0-9a-f]{6}$/, '');
    const results = [];
    let chain = Promise.resolve();
    specs.forEach(spec => {
      // "Notes" is a reserved custom-field name: eLabNext has a native Notes field on every sample
      // ("Notizen"). Use that (the documented `note` property), not a colliding custom field.
      chain = chain.then(() =>
      getSampleTypeMetaMap(run.plate_type_id).then(map => {
        stampMetaIDs(spec.metas, map);
        return apiCall('POST', 'samples',
          { sampleTypeID: run.plate_type_id, name: spec.name, note: spec.note, sampleMetas: spec.metas });
      })
        .then(sampleID => getSampleById(sampleID)
        .then(full => {
          const bc = (full && full.barcode) || '';
          // A created sample should always have a barcode; empty means the read-back didn't
          // return one. Flag it so it isn't silently mistaken for a valid join key.
          // `owner` is native to eLabNext (set server-side to whoever's session created the
          // sample), read it back here instead of asking the user to type an Operator name.
          return { spec, sampleID, barcode: bc, barcode_read_failed: !bc,
            owner: (full && full.owner) || '' };
        })
        .catch(() => ({
        spec,
        sampleID,
        barcode: '',
        barcode_read_failed: true,
        owner: ''
      })))
        .then(r => { results.push(r); }));
    });

    // Render the results dialog. Shown on success AND on partial failure, on failure the plates that
    // WERE created still appear here with their barcodes, so those (the analysis join key) are never
    // lost. `errMsg` non-empty means the run stopped partway.
    function showResultsDialog(errMsg) {
      // One row per created plate (plate · cell line · barcode), with per-barcode Copy / Copy-all
      // buttons so the codes go straight onto the plates (the barcode is the join key).
      const rows = results.map(r => {
        const s = r.spec;
        const label = [s.plate_label, s.cell_line].filter(Boolean).join(' · ') || '—';
        if (r.barcode_read_failed) {
          // Don't present the internal id as if it were the barcode, say the read failed and point
          // the user to the sample (the plate WAS created; only the barcode read-back didn't return).
          return `<tr><td style="padding-right:12px;">${esc(label)}</td><td colspan="2" class="bpt-error">barcode not read — open sample id ${esc(r.sampleID)} in Inventory to get it</td></tr>`;
        }
        const code = r.barcode;
        return `<tr><td style="padding-right:12px;">${esc(label)}</td><td style="font-family:ui-monospace,monospace;padding-right:12px;white-space:nowrap;">${esc(code)}</td><td><button type="button" class="bpt-copy-btn" data-copy="${esc(code)}">Copy</button></td></tr>`;
      }).join('');
      const allCodes = results.map(r => r.barcode || (`id ${r.sampleID}`)).join('\n');
      const csv = plateRecordsCSV(results, run, shortName);
      const banner = errMsg
        ? `<div class="bpt-error" style="margin-bottom:8px;">Creation stopped after an error: ${esc(errMsg)}. <b>${esc(results.length)} of ${esc(specs.length)}</b> plate(s) were created — their barcodes are below, <b>save them now</b> (copy or download). The remaining ${esc(specs.length - results.length)} were not created; fix the issue and log those again.</div>`
        : `<p>${esc(results.length)} plate record(s) created in Inventory (print run <b>${esc(run.print_run_id)}</b>), linked to <b>${esc(shortName)}</b>.</p><p class="bpt-hint" style="margin-top:8px;">Each plate has a unique barcode (its ID). Copy it onto the plate to identify it. (It can also be printed as a label if a label printer is set up.)</p>`;
      showDialog({ width: 580, title: (errMsg ? 'Partly created — save these barcodes' : 'Plates created'),
        content: `${banner}<table class="bpt-table"><tr><td style="color:#64748b;font-weight:600;">Plate · Cell line</td><td style="color:#64748b;font-weight:600;">Barcode</td><td></td></tr>${rows}</table><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button type="button" id="bpt-copy-all" class="bpt-btn bpt-btn-secondary" data-copy="${esc(allCodes)}">Copy all barcodes</button><button type="button" id="bpt-dl-csv" class="bpt-btn bpt-btn-secondary">Download CSV (barcodes + metadata)</button></div>`,
        afterRender() {
          function wire(btn) {
            if (!btn) return;
            btn.onclick = () => {
              const orig = btn.textContent;
              copyToClipboard(btn.getAttribute('data-copy')).then(ok => {
                btn.textContent = ok ? 'Copied ✓' : 'Copy failed';
                setTimeout(() => { btn.textContent = orig; }, 1400);
              });
            };
          }
          Array.prototype.forEach.call(document.querySelectorAll('.bpt-copy-btn'), wire);
          wire(document.getElementById('bpt-copy-all'));
          const dl = document.getElementById('bpt-dl-csv');
          if (dl) dl.onclick = () => {
            const ok = downloadText(`print-run-${run.print_run_id}.csv`, csv);
            if (!ok) { dl.textContent = 'Download blocked — use Copy instead'; }
          };
        }
      });
    }

    chain.then(() => {
      showResultsDialog('');
    }).catch(err => {
      // Partial failure: if ANY plates were created, show them so their barcodes aren't lost; only
      // fall back to a bare error when nothing at all was created.
      if (results.length) showResultsDialog((err && err.message) || String(err));
      else showError('Error', `No plates were created: ${(err && err.message) || String(err)}`);
    });
  };

  // ─── Test surface ─────────────────────────────────────────────────────────────
  // Pure functions exercised by the Node harnesses in addon/test/. Attached only when the test flag
  // __BPT_TEST__ is set, so it is absent from the shipped browser build. The harnesses set that flag
  // before loading the add-on. (typeof on an undeclared name is safe in strict mode.)
  if (typeof __BPT_TEST__ !== 'undefined' && __BPT_TEST__) {
    addon._test = {
      buildRunPlateSpecs,
      plateFieldProblem,
      plateRecordsCSV,
      nearestExisting,
      levenshtein,
      slugify,
      distinctMetaValues,
      buildDesignedPlates,
      parseRastrum,
      getSampleById,
      stampMetaIDs,
      groupFilesByFolder,
      shortenMiddle,
      listPhrase,
      getInstalledAddon,
      readStoredConfig,
      saveStoredConfig,
      resetInstalledAddonCache() { installedAddonPromise = null; },
      normaliseStoredConfig,
      applyConfig,
      CONFIG,
      checkTypeFields,
      prettyType,
      REQUIRED_SAMPLE_TYPE_FIELDS
    };
  }

})(BioprintTracker);
