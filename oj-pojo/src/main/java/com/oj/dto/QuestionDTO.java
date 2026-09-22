package com.oj.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.io.Serializable;

@Data
public class QuestionDTO implements Serializable {

    //主键
    private int id;

    //问题标题
    @NotBlank(message = "问题标题不能为空")
    @Size(max = 200, message = "问题标题不能超过200个字符")
    private String title;

    //问题描述
    @NotBlank(message = "问题描述不能为空")
    private String questionText;

    //难度
    @NotBlank(message = "难度不能为空")
    @Pattern(
            regexp = "^(EASY|MEDIUM|HARD)$",
            message = "难度取值不合法"
    )
    private String difficulty;

    //标准答案
    @NotBlank(message = "标准答案不能为空")
    private String standardSql;

    //排序方式
    @NotNull(message = "排序方式不能为空")
    @Min(value = 0, message = "排序方式只能是0或1")
    @Max(value = 1, message = "排序方式只能是0或1")
    private Integer orderSensitive;

    //是否可见
    @NotBlank(message = "是否可见不能为空")
    @Pattern(
            regexp = "^(DRAFT|PUBLISHED|DISABLED)$",
            message = "是否可见取值不合法"
    )
    private String status;

}
