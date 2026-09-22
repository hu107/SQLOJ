package com.oj.vo;


import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class UserVO implements Serializable {

    private int id;

    private String username;

    private String token;

}
