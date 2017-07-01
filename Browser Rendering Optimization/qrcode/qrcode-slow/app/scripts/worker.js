this.onmessage = function(evt) {
  
  var result = qrcode.decode(width, height, imageData);

  postMessage('response')
};