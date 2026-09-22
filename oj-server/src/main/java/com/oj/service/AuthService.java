package com.oj.service;

import com.oj.dto.LoginDTO;
import com.oj.dto.RegisterDTO;
import com.oj.vo.UserVO;

public interface AuthService {
    UserVO login(LoginDTO loginDTO);

    void register(RegisterDTO registerDTO);
}
