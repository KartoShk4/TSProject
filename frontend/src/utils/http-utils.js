import config from "../config/config";
import {AuthUtils} from "./auth-utils";

export class HttpUtils {
    // Используем useAuth только в том случае если нам нужен токен
    static async request(url, method = 'GET', useAuth = true, body = null) {
        const result = {
            error: false,
            response: null
        };

        const params = {
            method: method,
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json',
            },
        };

        let token = null;
        if (useAuth) {
            // Получили токен, нужен в случае запроса данных с сервера, используем его в "headers"
            let token = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
            if (token) {
                params.headers = params.headers || {};
                params.headers['x-auth-token'] = token;
            }
        }

        if (body) {
            params.body = JSON.stringify(body);
        }

        let response = null;
        try {
            response = await fetch(config.api + url, params)
            // Получаем токены из ответа
            result.response = await response.json();
        } catch (e) {
            result.error = true;
            return result;
        }

        if (response.status < 200 || response.status >= 300) {
            result.error = true;
            console.error('Server response:', result.response); // Логируем ответ сервера
            if (response.status === 400) {
                result.errorMessage = result.response.message || 'Invalid data provided';
            } else if (useAuth && response.status === 401) {
                let token = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
                if (!token) {
                    // 1 - токена нет
                    result.redirect = '/login';
                } else {
                    // 2 - токен устарел/невалидный (нужно обновить)
                    const updateTokenResult = await AuthUtils.updateRefreshToken();
                    if (updateTokenResult) {
                        // Повторяем запрос
                        return this.request(url, method, useAuth, body);
                    } else {
                        result.redirect = '/login'
                    }
                }
            }
        }
        return result;
    }
}