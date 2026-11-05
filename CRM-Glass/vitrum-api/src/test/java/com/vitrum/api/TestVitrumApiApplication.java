package com.vitrum.api;

import org.springframework.boot.SpringApplication;

public class TestVitrumApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(VitrumApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
