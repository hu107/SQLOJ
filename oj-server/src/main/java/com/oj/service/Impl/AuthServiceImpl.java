package com.oj.service.Impl;

import com.oj.constant.MessageConstant;
import com.oj.dto.LoginDTO;
import com.oj.dto.RegisterDTO;
import com.oj.entity.User;
import com.oj.exception.BaseException;
import com.oj.exception.LoginFailedException;
import com.oj.mapper.AuthMapper;
import com.oj.service.AuthService;
import com.oj.utils.JwtUtil;
import com.oj.vo.UserVO;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthMapper authMapper;
    @Autowired
    private JwtUtil jwtUtil;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * 用户登录
     */
    @Override
    public UserVO login(LoginDTO loginDTO) {
        User user = authMapper.login(loginDTO.getUsername());
        if (user == null) {
            throw new LoginFailedException(MessageConstant.ACCOUNT_PASSWORD_ERROR);
        }

        //用 matches 比较原始密码和数据库哈希
        boolean matched = encoder.matches(
                loginDTO.getPasswordHash(),
                user.getPasswordHash()
        );

        if (!matched) {
            log.error("密码或账号错误");
            throw new LoginFailedException(MessageConstant.ACCOUNT_PASSWORD_ERROR);
        }

        if (user.getStatus().equals("DISABLED")) {
            log.error("用户已被禁用");
            throw new LoginFailedException(MessageConstant.ACCOUNT_LOCKED);
        }
        //生成JWT令牌
        String token = jwtUtil.generateToken((long) user.getId(), user.getRole());
        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .token(token)
                .build();
    }


    /**
     * 用户注册
     */
    @Override
    public void register(@Valid @RequestBody RegisterDTO registerDTO) {
        String username = registerDTO.getUsername();
        String passwordHash = registerDTO.getPasswordHash();
        String confirmPassword = registerDTO.getConfirmPassword();
        if (!passwordHash.equals(confirmPassword)) {
            log.error("两次密码输入不一致");
            throw new LoginFailedException(MessageConstant.PASSWORD_MISMATCH);
        }
        passwordHash = encoder.encode(passwordHash);//加密密码
        User user = User.builder()
                .username(username)
                .passwordHash(passwordHash)
                .role("USER")
                .status("NORMAL")
                .createTime(LocalDateTime.now().toString())
                .updateTime(LocalDateTime.now().toString())
                .build();
        authMapper.register(user);
    }
}
