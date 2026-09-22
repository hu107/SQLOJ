package com.oj.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question implements Serializable {

    //主键
    private Integer id;

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

    //创建时间
    private String createTime;

    //更新时间
    private String updateTime;
}
