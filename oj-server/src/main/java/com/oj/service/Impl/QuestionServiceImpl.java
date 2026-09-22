package com.oj.service.Impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.oj.constant.MessageConstant;
import com.oj.dto.QuestionDTO;
import com.oj.dto.QuestionPageQueryDTO;
import com.oj.entity.Question;
import com.oj.exception.BaseException;
import com.oj.mapper.QuestionMapper;
import com.oj.result.PageResult;
import com.oj.service.QuestionService;
import com.oj.vo.AdminQuestionVO;
import com.oj.vo.QuestionVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service
public class QuestionServiceImpl implements QuestionService {
    @Autowired
    private QuestionMapper questionMapper;

    //分页查询题目列表
    @Override
    public PageResult pageQuery(QuestionPageQueryDTO questionPageQueryDTO) {
        int pageNum = questionPageQueryDTO.getPage();
        int pageSize = questionPageQueryDTO.getPageSize();
        PageHelper.startPage(pageNum, pageSize);
        Page<AdminQuestionVO> page = questionMapper.pageQuery(questionPageQueryDTO);
        return new PageResult(page.getTotal(), page.getResult());
    }

    //添加题目
    @Override
    public void addQuestion(QuestionDTO questionDTO) {
        Question question = new Question();
        BeanUtils.copyProperties(questionDTO, question);
        question.setCreateTime(LocalDateTime.now().toString());
        question.setUpdateTime(LocalDateTime.now().toString());
        questionMapper.addQuestion(question);
    }

    //删除题目
    @Override
    public void deleteQuestion(int id) {
        //查询题目是否存在
        QuestionVO questionVO = questionMapper.getById(id);
        if (questionVO == null) {
            throw new BaseException(MessageConstant.QUESTION_NOT_FOUND);
        }
        //删除题目
        questionMapper.deleteQuestion(id);
    }

    //根据题目ID查询题目详情
    @Override
    public QuestionVO getById(int id) {
        return questionMapper.getById(id);
    }

    //更新题目
    @Override
    public void updateQuestion(QuestionDTO questionDTO) {
        //查询题目是否存在
        QuestionVO questionVO = questionMapper.getById(questionDTO.getId());
        if (questionVO == null) {
            throw new BaseException(MessageConstant.QUESTION_NOT_FOUND);
        }
        Question question = new Question();
        BeanUtils.copyProperties(questionDTO, question);
        question.setUpdateTime(LocalDateTime.now().toString());
        questionMapper.updateQuestion(question);
    }
}
