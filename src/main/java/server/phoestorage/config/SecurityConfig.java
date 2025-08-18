package server.phoestorage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import server.phoestorage.service.AppUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final AppUserDetailsService userDetailsService;

    public SecurityConfig(AppUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/admin/**", "/admin/**").hasRole("ADMIN")
                        .requestMatchers("/login", "/api/public/**", "/style/**", "/resource/**", "/pages/download.html", "/code/download.js", "/download/**", "/notfound").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/")
                        .failureUrl("/login?error")
                        .permitAll()
                )
                .logout(form -> form.deleteCookies("JSESSIONID")
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .permitAll()
                )
                .rememberMe(rememberMe -> rememberMe.key("jsR8IZVS2M|6)wf"))
                .build();
    }

    @Bean
    public AuthenticationManager authManager(HttpSecurity http) throws Exception {
        var builder = http.getSharedObject(AuthenticationManagerBuilder.class);

        builder
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder());

        return builder.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}