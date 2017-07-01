var QRWorker = new Worker('./scripts/jsqrcode/qrworker.js');

var QRClient = function() {

  var currentCallback;  

  this.decode = function(imageData, callback) {
    
    var width = imageData.width;
    var height = imageData.height;


    QRWorker.onmessage = function(msg) {
      if (msg.data) callback(msg.data);
    };

    QRWorker.onerror = function(err) {
      var WorkerException = function() {
        this.name = "WorkerException";
        this.message = "Error passing data to/from worker";
      };

      WorkerException.prototype = Object.create(Error.prototype);

      throw new WorkerException;
    };

    QRWorker.postMessage(imageData);

  };
 };