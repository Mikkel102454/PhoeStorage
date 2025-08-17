package server.phoestorage.controller.frontend;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import server.phoestorage.service.HandlerService;
import server.phoestorage.service.LinkService;

@Controller
public class PageController {

    private final ResourceController resourceController;
    private final LinkService linkService;
    private final HandlerService handlerService;

    public PageController(ResourceController resourceController, LinkService linkService, HandlerService handlerService) {
        this.resourceController = resourceController;
        this.linkService = linkService;
        this.handlerService = handlerService;
    }

    @Cacheable("resources")
    @GetMapping("/{page}")
    public String rootPage(@PathVariable String page) {
        if (page.endsWith(".html")) page = page.substring(0, page.length() - 5);

        return "frontend/pages/" + page;
    }

    @Cacheable("resources")
    @GetMapping("/download/{uuid}")
    public String downloadPage(@PathVariable String uuid) {
        String path;
        if(linkService.isLinkValid(uuid) != null){
            return "frontend/pages/download";
        }else{
            return handlerService.get404();
        }

    }

    @Cacheable("resources")
    @GetMapping("/")
    public String index() {
        return "frontend/pages/index";
    }
}
