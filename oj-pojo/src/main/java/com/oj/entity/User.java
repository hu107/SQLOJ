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
public class User implements Serializable {

    private int id;

    private String username;

    private String passwordHash;

    private String role;

    private String status;

    private String createTime;

    private String updateTime;
}
