package server.phoestorage.zip;

import java.io.OutputStream;

public class ZipBridge {
    static {
        System.load(System.getProperty("user.dir") + "/src/native/zipbridge.dll");
    }

    public native void streamZip(String[] zipNames, String[] diskPaths, OutputStream out);
}
