// Cloudflare Pages Functions — 处理 /api/links 的 CRUD
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // 例如 /api/links/123 => id = 123
    const id = pathSegments.length > 2 ? parseInt(pathSegments[2]) : null;

    // 1. GET：获取所有链接
    if (request.method === 'GET') {
        const data = await env.LINKS.get('links_data', 'json') || [];
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. 验证密钥（POST/PUT/DELETE 都需要）
    const auth = request.headers.get('X-Auth-Key');
    if (auth !== 'toto123') {
        return new Response(JSON.stringify({ error: '未授权' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 3. POST：新增链接
    if (request.method === 'POST') {
        const body = await request.json();
        const { description, url } = body;
        if (!description || !url) {
            return new Response(JSON.stringify({ error: '描述和链接地址不能为空' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const data = await env.LINKS.get('links_data', 'json') || [];
        const newItem = { id: Date.now(), description, url };
        data.push(newItem);
        await env.LINKS.put('links_data', JSON.stringify(data));
        return new Response(JSON.stringify(newItem), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 4. PUT：修改链接（需要 id）
    if (request.method === 'PUT' && id !== null) {
        const body = await request.json();
        const { description, url } = body;
        if (!description || !url) {
            return new Response(JSON.stringify({ error: '描述和链接地址不能为空' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        let data = await env.LINKS.get('links_data', 'json') || [];
        const idx = data.findIndex(item => item.id === id);
        if (idx === -1) {
            return new Response(JSON.stringify({ error: '链接不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        data[idx] = { ...data[idx], description, url };
        await env.LINKS.put('links_data', JSON.stringify(data));
        return new Response(JSON.stringify(data[idx]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 5. DELETE：删除链接（需要 id）
    if (request.method === 'DELETE' && id !== null) {
        let data = await env.LINKS.get('links_data', 'json') || [];
        const filtered = data.filter(item => item.id !== id);
        if (filtered.length === data.length) {
            return new Response(JSON.stringify({ error: '链接不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        await env.LINKS.put('links_data', JSON.stringify(filtered));
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 其他情况
    return new Response('Method Not Allowed', { status: 405 });
}