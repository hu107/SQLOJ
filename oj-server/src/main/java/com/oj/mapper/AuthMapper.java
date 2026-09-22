package com.oj.mapper;

import com.oj.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuthMapper {
    User login(String username);

    void register(User user);
}
