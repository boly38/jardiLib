const JardiConsole =  require('./JardiConsole.js');

try {
    console.info("Starting JardiConsole");
    let jardiConsole = new JardiConsole();
} catch (exception) {
    console.info("JardiConsole Exception", exception);
}