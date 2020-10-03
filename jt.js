const JardiTerm =  require('./lib/JardiTerm.js');
try {
    new JardiTerm();
} catch (exception) {
    console.info("JardiTerm Exception: ", exception);
}