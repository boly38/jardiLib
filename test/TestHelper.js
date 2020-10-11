class TestHelper {

    static asPromise(context, callbackFunction, ...args) {
      return new Promise((resolve, reject) => {
          args.push((err, data) => {
              if (err) {
                  reject(err);
              } else {
                  resolve(data);
              }
          });
          if (context) {
              callbackFunction.call(context, ...args);
          } else {
              callbackFunction(...args);
          }
      });
    }

    static sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports = TestHelper;