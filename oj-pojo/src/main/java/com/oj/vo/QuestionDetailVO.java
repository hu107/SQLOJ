package com.oj.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class QuestionDetailVO implements Serializable {

    //主键
    private int id;

    //问题标题
    private String title;

    //问题描述
    private String questionText;

    //题目涉及的表结构
    private List<TableDataVO> tables;

    //难度
    private String difficulty;

}
