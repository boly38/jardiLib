const JardiDocs =  require('./lib/JardiDocs.js');

class JardiSample {
  constructor(cb) {
    this.jd = new JardiDocs(process.env.JARDI_MONGO_URI);
    this.jd.init()
    .then(() => cb())
    .catch((err) => cb(err));
  }

  list(cb) {
    this.jd.listDocuments({})
    .then((docs)=> {
      console.log("docs:", docs);
      cb(null, docs);
    })
    .catch((err) => {
       console.error("list error:",err);
       cb(err);
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
        js.list(() => {
          js.close();
        });
    });
} catch (exception) {
    console.info("JardiSample Exception: ", exception);
}