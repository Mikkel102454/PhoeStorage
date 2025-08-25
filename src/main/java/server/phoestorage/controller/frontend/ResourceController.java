package server.phoestorage.controller.frontend;

import io.micrometer.core.instrument.util.IOUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import server.phoestorage.service.HandlerService;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@RestController
public class ResourceController {
    private final HandlerService handlerService;
    private final ResourceLoader resourceLoader;

    public ResourceController(ResourceLoader resourceLoader, HandlerService handlerService) {
        this.resourceLoader = resourceLoader;
        this.handlerService = handlerService;
    }

    @GetMapping(value = "/code/**", produces = "text/javascript")
    public ResponseEntity<String> code(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String file = uri.substring("/code/".length());

        if (!file.endsWith(".js")) {
            file += ".js";
        }

        String path = "classpath:frontend/code/" + file;
        return getResource(path);
    }
    @GetMapping("/style/**")
    public ResponseEntity<String> style(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String file = uri.substring("/style/".length());

        if (!file.endsWith(".css")) {
            file += ".css";
        }

        String path = "classpath:frontend/style/" + file;
        return getResource(path);
    }

    @Cacheable("resources")
    @GetMapping("/resource/{*file}")
    public ResponseEntity<String> resource(@PathVariable String file) {
        String path = "classpath:frontend/resources/" + file;
        return getResource(path);
    }

    public ResponseEntity<String> getResource(String path) {
        Resource resource = resourceLoader.getResource(path);

        if (!resource.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
        }

        try {
            InputStream in = resource.getInputStream();
            return ResponseEntity.ok(IOUtils.toString(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }
}
