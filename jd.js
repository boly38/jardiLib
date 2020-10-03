const JardiDocs =  require('./lib/JardiDocs.js');

class JardiSample {
  constructor(cb) {
    this.jd = new JardiDocs(process.env.JARDI_MONGO_URI);
    this.jd.init(cb);
  }

  sample(cb) {
    this.jd.example(cb);
  }

  list(cb) {
    this.jd.listDocuments({}, (err,docs) => {
      if (err) {
        console.error("list error:",err);
        cb();
        return;
      }
      console.log("docs:", docs);
      cb();
    });
  }

  removeSample(cb) {
    this.jd.deleteDocumentsAddOne({},  (err,docs) => {
       if (err) {
         console.error("removeSample error:",err);
         cb();
         return;
       }
       console.log("docs:", docs);
       cb();
     });
  }

  close() {
    var jd = this.jd;
    jd.close();
  }

}

try {
    var js = new JardiSample((err) => {
        if (err) {
          console.error("init error:", err);
          return;
        }
        js.sample(() => {
            js.list(() => {
                js.removeSample(() => {
                    js.list(() => {
                        js.close();
                    });
                });
            });
        });
    });
} catch (exception) {
    console.info("JardiSample Exception:", exception);
}