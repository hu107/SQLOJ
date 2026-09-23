package com.oj.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class AdminQuestionTitleVO implements Serializable {

    //主键
    private int id;

    //问题标题
    private String title;

    //难度
    private String difficulty;

    //排序方式
    private int orderSensitive;

    //是否可见
    private String status;

    //创建时间
    private String createTime;

    //更新时间
    private String updateTime;

}
