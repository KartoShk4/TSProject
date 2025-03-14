import { AuthUtils } from "../../utils/auth-utils";
import { HttpUtils } from "../../utils/http-utils";

export class SignUp {
    private readonly openNewRoute: (route: string) => void;
    private fullNameElement: HTMLInputElement | null | undefined;
    private emailElement: HTMLInputElement | null | undefined;
    private readonly passwordElement: HTMLInputElement | null | undefined;
    private readonly passwordRepeatElement: HTMLInputElement | null | undefined;
    private readonly commonErrorElement: HTMLElement | null | undefined;

    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;

        // Проверка наличия токена, если он есть, перенаправляем на главную страницу
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            openNewRoute('/');
            return;
        }

        // Инициализация DOM-элементов
        this.fullNameElement = document.getElementById('full-name') as HTMLInputElement;
        this.emailElement = document.getElementById('email') as HTMLInputElement;
        this.passwordElement = document.getElementById('password') as HTMLInputElement;
        this.passwordRepeatElement = document.getElementById('password-repeat') as HTMLInputElement;
        this.commonErrorElement = document.getElementById('common-error') as HTMLElement;

        // Добавление обработчика событий
        document.getElementById('process-button')?.addEventListener('click', this.signUp.bind(this));
    }

    // Метод для валидации формы
    private validateForm(): boolean {
        let isValid: boolean = true;

        // Проверяем поле ФИО
        if (this.fullNameElement?.value) {
            this.fullNameElement.classList.remove('is-invalid');
        } else {
            this.fullNameElement?.classList.add('is-invalid');
            isValid = false;
        }

        // Проверка email с регулярным выражением
        if (this.emailElement?.value && this.emailElement.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.emailElement.classList.remove('is-invalid');
        } else {
            this.emailElement?.classList.add('is-invalid');
            isValid = false;
        }

        // Проверка пароля
        if (this.passwordElement?.value && this.passwordElement.value.match(/^(?=.*[A-Z])(?=.*\d).{8,}$/)) {
            this.passwordElement.classList.remove('is-invalid');
        } else {
            this.passwordElement?.classList.add('is-invalid');
            isValid = false;
        }

        // Проверка на совпадение пароля
        if (this.passwordRepeatElement && this.passwordElement && this.passwordRepeatElement.value && this.passwordRepeatElement.value === this.passwordElement.value) {
            this.passwordRepeatElement.classList.remove('is-invalid');
        } else {
            this.passwordRepeatElement?.classList.add('is-invalid');
            isValid = false;
        }

        return isValid;
    }

    // Метод для регистрации пользователя
    private async signUp(): Promise<void> {
        if (!this.commonErrorElement) return;

        // Скрываем ошибку в начале
        this.commonErrorElement.style.display = 'none';

        // Выполняем запрос авторизации, если форма валидна
        if (this.validateForm()) {
            const result = await HttpUtils.request('/signup', 'POST', false, {
                name: this.fullNameElement?.value.split(' ')[1] || '',
                lastName: this.fullNameElement?.value.split(' ')[0] || '',
                email: this.emailElement?.value,
                password: this.passwordElement?.value,
                passwordRepeat: this.passwordRepeatElement?.value,
            });

            if (result.error || !result.response || (result.response && (!result.response.id || !result.response.name))) {
                this.commonErrorElement.style.display = 'block';
                return;
            }

            // Скрываем ошибку при успешной авторизации
            this.commonErrorElement.style.display = 'none';

            // Сохраняем данные в localStorage
            const userInfo = {
                id: result.response.user.id,
                email: result.response.user.email,
                name: result.response.user.name,
                lastName: result.response.user.lastName
            };

            localStorage.setItem(AuthUtils.userInfoTokenKey, JSON.stringify(userInfo));

            // Перенаправляем на страницу входа
            this.openNewRoute('/login');
        }
    }
}
