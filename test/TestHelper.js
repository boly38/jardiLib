const expect = require('chai').expect

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

    static expectDocEntry(entry, field, value) {
      expect(entry[field], 'doc entry['+field+']').to.eql(value);
    }

    static expectDocEntryPeriod(entry, field, value) {
      expect(entry[field].m, 'doc entry['+field+'].m').to.eql(value);
    }

}

module.exports = TestHelper;