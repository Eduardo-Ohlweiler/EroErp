package com.vitrum.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class VitrumApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
