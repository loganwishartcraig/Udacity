importScripts('imageManips.js');

this.onmessage = function(e) {
  var imageData = e.data.imageData;
  var type = e.data.type;

  var transformPixel = manipulate(type);

  try {
    length = imageData.data.length;
    for (var i = 0; i < length; i += 4) {
      r = imageData.data[i];
      g = imageData.data[i + 1];
      b = imageData.data[i + 2];
      a = imageData.data[i + 3];
      pixel = transformPixel(r, g, b, a);
      imageData.data[i] = pixel[0];
      imageData.data[i + 1] = pixel[1];
      imageData.data[i + 2] = pixel[2];
      imageData.data[i + 3] = pixel[3];
    }
    postMessage(imageData);
  } catch (e) {
    function ManipulationException(message) {
      this.name = "ManipulationException";
      this.message = message;
    };
    throw new ManipulationException('Image manipulation error');
    postMessage(undefined);
  }
}