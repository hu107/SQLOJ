package com.oj.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class QuestionVO implements Serializable {
    //主键
    private int id;

    //问题标题
    private String title;

    //问题描述
    private String questionText;

    //难度
    private String difficulty;

    //标准答案
    private String standardSql;

    //排序方式
    private Integer orderSensitive;

    //是否可见
    private String status;

}
