class Download{
    ownerUuid // string
    fileName // string
    fileExtension // string
    dateExpire // string
    isFolder // boolean
    size // long
    constructor(ownerUuid, fileName, fileExtension, dateExpire, isFolder, size){
        this.ownerUuid = ownerUuid
        this.fileName = fileName
        this.fileExtension = fileExtension
        this.dateExpire = dateExpire
        this.isFolder = isFolder
        this.size = size
    }
}