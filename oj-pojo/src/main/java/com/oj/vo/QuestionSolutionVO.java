package com.oj.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class QuestionSolutionVO implements Serializable {
    //答案
    private String standardSql;
}
