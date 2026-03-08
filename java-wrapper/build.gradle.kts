plugins {
    id("java")
    id("io.ktor.plugin") version "2.3.12"
}

group = "me.fponzi"
version = "0.1.0"

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

repositories {
    mavenLocal()
    mavenCentral()
    maven {
        url = uri("https://central.sonatype.com/repository/maven-snapshots/")
    }
}

dependencies {
    implementation("org.lamport:tla2tools:1.8.0-SNAPSHOT")
    implementation("com.google.code.gson:gson:2.8.6")
    testImplementation("junit:junit:4.13.2")
}

tasks.withType<Copy> {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

application {
    mainClass = "me.fponzi.tlaplusweb.TlcRunner"
}

ktor {
    fatJar {
        archiveFileName.set("tlaplus-web.jar")
    }
}

tasks.register<Jar>("buildWebJar") {
    description = "Build a fat JAR for CheerpJ (excludes classes incompatible with Java 11)"
    dependsOn("buildFatJar")
    archiveFileName.set("tlaplus-web-cheerpj.jar")
    destinationDirectory.set(layout.buildDirectory.dir("libs"))
    from(provider { zipTree(layout.buildDirectory.file("libs/tlaplus-web.jar")) }) {
        exclude("META-INF/versions/**")
        exclude("**/module-info.class")
    }
    manifest {
        attributes("Main-Class" to "me.fponzi.tlaplusweb.TlcRunner")
    }
}
