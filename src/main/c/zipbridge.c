#include <jni.h>
#include <stdio.h>
#include <string.h>
#include "server_phoestorage_zip_ZipBridge.h"
#include "miniz.h"

JNIEXPORT void JNICALL Java_server_phoestorage_zip_ZipBridge_streamZip
  (JNIEnv *env, jobject obj, jobjectArray zipNames, jobjectArray diskPaths, jobject outputStream) {

    jsize count = (*env)->GetArrayLength(env, zipNames);
    jclass outputClass = (*env)->GetObjectClass(env, outputStream);
    jmethodID writeMethod = (*env)->GetMethodID(env, outputClass, "write", "([BII)V");

    mz_zip_archive zip;
    memset(&zip, 0, sizeof(zip));
    mz_zip_writer_init_heap(&zip, 0, 0);

    for (jsize i = 0; i < count; i++) {
        jstring jname = (jstring)(*env)->GetObjectArrayElement(env, zipNames, i);
        jstring jpath = (jstring)(*env)->GetObjectArrayElement(env, diskPaths, i);

        const char *zipName = (*env)->GetStringUTFChars(env, jname, NULL);
        const char *diskPath = (*env)->GetStringUTFChars(env, jpath, NULL);

        mz_zip_writer_add_file(&zip, zipName, diskPath, NULL, 0, MZ_DEFAULT_COMPRESSION);

        (*env)->ReleaseStringUTFChars(env, jname, zipName);
        (*env)->ReleaseStringUTFChars(env, jpath, diskPath);
    }

    void *pBuf = NULL;
    size_t zipSize = 0;
    if (!mz_zip_writer_finalize_heap_archive(&zip, &pBuf, &zipSize)) {
        printf("ZIP finalize failed\n");
        return;
    }

    int chunkSize = 8192;
    for (size_t i = 0; i < zipSize; i += chunkSize) {
        int len = (zipSize - i > chunkSize) ? chunkSize : (zipSize - i);
        jbyteArray chunk = (*env)->NewByteArray(env, len);
        (*env)->SetByteArrayRegion(env, chunk, 0, len, (jbyte *)((char *)pBuf + i));
        (*env)->CallVoidMethod(env, outputStream, writeMethod, chunk, 0, len);
        (*env)->DeleteLocalRef(env, chunk);
    }

    mz_zip_writer_end(&zip);
}
