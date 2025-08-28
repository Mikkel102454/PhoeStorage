package server.phoestorage.utils;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.crypto.password.StandardPasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;

import java.util.HashMap;

public class PasswordEncoding {
    private static final HashMap<String, PasswordEncoder> encoders = new HashMap<>();

    static {
        encoders.put("bcrypt", new BCryptPasswordEncoder(10));
        encoders.put("argon2@5.8", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
        encoders.put("pbkdf2@5.8", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8());
        encoders.put("scrypt@5.8", SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8());
    }

    public static String encode(String encoderId, String password) {
        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(encoderId, encoders);
        return encoder.encode(password);
    }

    public static PasswordEncoder getEncoder(String encoderId) {
        return new DelegatingPasswordEncoder(encoderId, encoders);
    }

    public static boolean matches(String encoderId, String rawPassword, String encodedPassword) {
        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(encoderId, encoders);
        return encoder.matches(rawPassword, encodedPassword);
    }
}