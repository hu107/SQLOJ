package com.oj.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

@Data
public class QuestionPageQueryDTO implements Serializable {

    @Min(value = 1, message = "页码不能小于1")
    private int page = 1; //当前页码，默认 1;

    @Min(value = 1, message = "每页条数不能小于1")
    @Max(value = 100, message = "每页条数不能超过100")
    private int pageSize = 10; //每页记录数，默认 10;

}
