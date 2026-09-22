package com.oj.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
@Data
public class RegisterDTO implements Serializable {

    private int id;

    @NotBlank(message = "用户名不能为空")
    @Size(
            min = 4,
            max = 10,
            message = "用户名长度必须为4到10个字符"
    )
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(
            min = 8,
            max = 20,
            message = "密码长度必须为8到20个字符"
    )
    private String passwordHash;

    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;

}
