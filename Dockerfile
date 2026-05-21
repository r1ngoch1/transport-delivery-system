FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

ARG SERVICE_MODULE

COPY pom.xml ./pom.xml
COPY openapi ./openapi
COPY services ./services

RUN mvn -pl ${SERVICE_MODULE} -am package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

ARG SERVICE_MODULE

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/${SERVICE_MODULE}/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
