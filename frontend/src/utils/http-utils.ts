import config from "../config/config";
import {AuthUtils} from "./auth-utils";

// Тип для результатов запроса
interface HttpResponse {
    error: boolean;
    response: any | null;
    errorMessage?: string;
    redirect?: string;
}

export class HttpUtils {
    static async request<T>(
        url: string,
        method: string = 'GET',
        useAuth: boolean = true,
        body: any = null
    ): Promise<HttpResponse> {
        const result: HttpResponse = {
            error: false,
            response: null,
        };

        // Явное указание типа заголовков
        const headers: HeadersInit = {
            'Content-type': 'application/json',
            'Accept': 'application/json',
        };

        if (useAuth) {
            const token: any = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
            if (token) {
                headers['x-auth-token'] = token;
            }
        }

        const params: RequestInit = {
            method: method,
            headers: headers,
        };

        if (body) {
            params.body = JSON.stringify(body);
        }

        let response: Response | null = null;
        try {
            response = await fetch(config.api + url, params);
            result.response = await response.json();
        } catch (e) {
            result.error = true;
            return result;
        }

        if (response.status < 200 || response.status >= 300) {
            result.error = true;
            console.error('Server response:', result.response); // Логируем ответ сервера
            if (response.status === 400) {
                result.errorMessage = result.response?.message || 'Invalid data provided';
            } else if (useAuth && response.status === 401) {
                const token: string | { [p: string]: string | null } = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
                if (!token) {
                    result.redirect = '/login'; // Токен отсутствует
                } else {
                    const updateTokenResult: boolean = await AuthUtils.updateRefreshToken();
                    if (updateTokenResult) {
                        return this.request<T>(url, method, useAuth, body); // Повторяем запрос с обновлённым токеном
                    } else {
                        result.redirect = '/login'; // Токен устарел, редирект на /login
                    }
                }
            }
        }

        return result;
    }
}
