const JardiDocsConsole =  require('./lib/JardiDocsConsole.js');
try {
    console.info("Starting JardiDocsConsole");
    new JardiDocsConsole();
} catch (exception) {
    console.info("JardiDocsConsole Exception", exception);
}