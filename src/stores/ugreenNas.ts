// 文件上传服务配置
class UGREENStorageService {
    private webdavUrl: string;
    private username: string;
    private password: string;
    private basePath: string;

    constructor() {
        // 根据环境选择不同的WebDAV URL
        if (import.meta.env.PROD) {
            // 开发环境：直接访问内网IP
            this.webdavUrl = 'http://192.168.1.27:5005';
        } else {
            // 生产环境：使用反向代理路径
            this.webdavUrl = '/api/nas';
        }
        this.username = 'zy_iwish';
        this.password = '199999zY';
        this.basePath = '/public/';
    }

    // 设置基础路径
    setBasePath(path: string) {
        this.basePath = path;
    }

    // 获取当前基础路径
    getBasePath(): string {
        return this.basePath;
    }
    
    // 上传文件到NAS
    async uploadFile(file: File, targetPath: string) {
        const url = `${this.webdavUrl}${this.basePath}${targetPath}`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
                    'Content-Type': file.type,
                    'Content-Length': file.size.toString()
                },
                body: file
            });
            
            if (response.ok) {
                return {
                    success: true,
                    url: url,
                    path: targetPath
                };
            } else {
                const errorText = await response.text();
                console.error('服务器响应错误:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }
    
    // 从NAS下载文件
    async downloadFile(filePath: string): Promise<Blob> {
        const url = `${this.webdavUrl}${this.basePath}${filePath}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
                }
            });
            
            if (response.ok) {
                return await response.blob();
            } else {
                throw new Error(`Download failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    // 获取NAS中的文件列表
    async getFileList(path: string = ''): Promise<Array<{
        name: string;
        path: string;
        size: number;
        type: 'file' | 'directory';
        modified: string;
        isDirectory: boolean;
    }>> {
        const url = `${this.webdavUrl}${this.basePath}${path}`;
        
        try {
            const response = await fetch(url, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
                    'Depth': '1',
                    'Content-Type': 'application/xml'
                },
                body: `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
    <prop>
        <resourcetype/>
        <getcontentlength/>
        <getlastmodified/>
    </prop>
</propfind>`
            });
            
            if (response.ok) {
                const xmlText = await response.text();
                return this.parseWebDAVResponse(xmlText);
            } else {
                throw new Error(`Failed to get file list: ${response.status}`);
            }
        } catch (error) {
            console.error('Get file list error:', error);
            throw error;
        }
    }

    // 解析WebDAV响应
    private parseWebDAVResponse(xmlText: string): Array<{
        name: string;
        path: string;
        size: number;
        type: 'file' | 'directory';
        modified: string;
        isDirectory: boolean;
    }> {
        const files: Array<{
            name: string;
            path: string;
            size: number;
            type: 'file' | 'directory';
            modified: string;
            isDirectory: boolean;
        }> = [];

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // 查找所有response元素
            const responses = xmlDoc.getElementsByTagName('D:response');

            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                const href = response.getElementsByTagName('D:href')[0]?.textContent || '';
                
                // 跳过根目录
                if (href === this.basePath || href === this.basePath.slice(0, -1) || href === '/public/') {
                    continue;
                }
                
                // 提取文件名
                const pathParts = href.split('/');
                const name = pathParts[pathParts.length - 1] || '';
                
                // 跳过空名称
                if (!name) continue;
                
                let size = 0;
                let modified = '';
                let isDirectory = false;
                
                // 查找所有propstat元素
                const propstats = response.getElementsByTagName('D:propstat');
                
                for (let j = 0; j < propstats.length; j++) {
                    const propstat = propstats[j];
                    const status = propstat.getElementsByTagName('D:status')[0]?.textContent || '';
                    
                    // 只处理成功的响应
                    if (status.includes('200 OK')) {
                        const prop = propstat.getElementsByTagName('D:prop')[0];
                        if (prop) {
                            // 检查是否为目录
                            const resourcetype = prop.getElementsByTagName('D:resourcetype')[0];
                            if (resourcetype && resourcetype.children.length > 0) {
                                isDirectory = true;
                            }
                            
                            // 获取文件大小
                            const getcontentlength = prop.getElementsByTagName('D:getcontentlength')[0];
                            if (getcontentlength && getcontentlength.textContent) {
                                size = parseInt(getcontentlength.textContent) || 0;
                            }
                            
                            // 获取修改时间
                            const getlastmodified = prop.getElementsByTagName('D:getlastmodified')[0];
                            if (getlastmodified && getlastmodified.textContent) {
                                modified = getlastmodified.textContent;
                            }
                        }
                    }
                }
                
                // 如果href以/结尾，说明是目录
                if (href.endsWith('/')) {
                    isDirectory = true;
                }
                
                files.push({
                    name,
                    path: href,
                    size,
                    type: isDirectory ? 'directory' : 'file',
                    modified,
                    isDirectory
                });
            }
        } catch (error) {
            console.error('Parse WebDAV response error:', error);
        }
        
        return files;
    }

    // 删除NAS中的文件
    async deleteFile(filePath: string): Promise<boolean> {
        const url = `${this.webdavUrl}${this.basePath}${filePath}`;
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Delete file error:', error);
            return false;
        }
    }
}

export default UGREENStorageService;