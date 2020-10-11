const JardiConsole =  require('./lib/JardiConsole');

try {
    console.info("Starting JardiConsole");
    let jardiConsole = new JardiConsole();
} catch (exception) {
    console.info("JardiConsole Exception", exception);
}