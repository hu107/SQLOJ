package com.oj.controller;

import com.oj.dto.LoginDTO;
import com.oj.dto.RegisterDTO;
import com.oj.result.Result;
import com.oj.service.AuthService;
import com.oj.vo.UserVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class AuthController {
    @Autowired
    private AuthService authService;
    @PostMapping("/login")
    public Result<UserVO> login(@RequestBody LoginDTO loginDTO) {
        log.info("用户登录：{}", loginDTO.getUsername());
        UserVO userVO = authService.login(loginDTO);
        userVO = UserVO.builder()
                .id(userVO.getId())
                .username(userVO.getUsername())
                .token(userVO.getToken())
                .build();
        return Result.success(userVO);//登录成功返回token
    }

    @PostMapping("/register")
    public Result<Void> register(@RequestBody RegisterDTO registerDTO) {
        log.info("用户注册：{}", registerDTO);
        authService.register(registerDTO);
        return Result.success();
    }
}
