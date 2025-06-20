package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.ModelAndView;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class HandlerService {
    private final TemplateEngine templateEngine;
    private final ResourceLoader resourceLoader;

    @Autowired
    public HandlerService(TemplateEngine templateEngine, ResourceLoader resourceLoader) {
        this.templateEngine = templateEngine;
        this.resourceLoader = resourceLoader;
    }

    @Cacheable("static-responses")
    public String get400() {
        Resource resource = resourceLoader.getResource("classpath:handlers/400.html");
        if (!resource.exists()) {
            return "400 not found was not found (??? classpath issue. contact support)";
        }

        try {
            InputStream in = resource.getInputStream();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return get500(e);
        }
    }

    @Cacheable("static-responses")
    public String get403() {
        Resource resource = resourceLoader.getResource("classpath:handlers/403.html");
        if (!resource.exists()) {
            return "403 forbidden was not found (??? classpath issue. contact support)";
        }

        try {
            InputStream in = resource.getInputStream();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return get500(e);
        }
    }

    @Cacheable("static-responses")
    public String get404() {
        Resource resource = resourceLoader.getResource("classpath:handlers/404.html");
        if (!resource.exists()) {
            return "404 not found was not found (??? classpath issue. contact support)";
        }

        try {
            InputStream in = resource.getInputStream();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return get500(e);
        }
    }

    @Cacheable(cacheNames = "resources", key = "#throwable")
    public String get500(Throwable throwable) {
        Context context = new Context();

        String type = throwable.getClass().getSimpleName();
        String message = throwable.getMessage();

        context.setVariable("errorType", type);
        context.setVariable("error", message);

        return templateEngine.process("handlers/500", context);
    }
}