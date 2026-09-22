package com.oj.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class QuestionDetailVO implements Serializable {

    //主键
    private int id;

    //问题标题
    private String title;

    //问题描述
    private String questionText;

    //难度
    private String difficulty;

}
