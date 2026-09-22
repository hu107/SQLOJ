package com.oj.controller.admin;

import com.oj.dto.QuestionDTO;
import com.oj.dto.QuestionPageQueryDTO;
import com.oj.result.PageResult;
import com.oj.result.Result;
import com.oj.service.QuestionService;
import com.oj.vo.QuestionVO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/question")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    //分页查询题目
    @GetMapping("/page")
    public Result<PageResult> question(@Valid QuestionPageQueryDTO questionPageQueryDTO) {
        PageResult pageResult = questionService.pageQuery(questionPageQueryDTO);
        return Result.success(pageResult);
    }

    //新增题目
    @PostMapping("/add")
    public Result<Void> addQuestion(@Valid @RequestBody QuestionDTO questionDTO) {
        questionService.addQuestion(questionDTO);
        return Result.success();
    }

    //删除题目
    @DeleteMapping("/{id}")
    public Result<Void> deleteQuestion(@PathVariable int id) {
        questionService.deleteQuestion(id);
        return Result.success();
    }

    //根据id查询题目
    @GetMapping("/{id}")
    public Result<QuestionVO>  getById(@PathVariable int id) {
         QuestionVO questionVO = questionService.getById(id);
        return Result.success(questionVO);
    }

    //更新题目
    @PutMapping
    public Result<Void> updateQuestion(@Valid @RequestBody QuestionDTO questionDTO) {
        questionService.updateQuestion(questionDTO);
        return Result.success();
    }
}
