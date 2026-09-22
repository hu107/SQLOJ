package com.oj.exception;

/**
 * 业务异常基类
 * <p>
 * 继承 RuntimeException，抛业务异常时无需在方法上声明 throws，
 * 由全局异常处理器统一捕获并返回错误响应。
 */
public class BaseException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public BaseException(String msg) {
        super(msg);
    }
}