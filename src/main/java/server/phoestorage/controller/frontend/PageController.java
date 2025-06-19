package server.phoestorage.controller.frontend;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PageController {

    private final ResourceController resourceController;

    public PageController(ResourceController resourceController) {
        this.resourceController = resourceController;
    }

    @Cacheable("resources")
    @GetMapping("/{page}")
    public ResponseEntity<String> rootPage(@PathVariable String page) {
        if (page.endsWith(".html")) page = page.substring(0, page.length() - 5);
        String path = "classpath:frontend/pages/" + page + ".html";

        return resourceController.getResource(path);
    }

    @Cacheable("resources")
    @GetMapping("/")
    public ResponseEntity<String> index() {
        return resourceController.getResource("classpath:frontend/pages/index.html");
    }
}
