import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { User, UserService } from './services/user.service';
import { ToDo, TodoService } from './services/todo.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'angular-redux-signal';

  userService = inject(UserService);
  todoService = inject(TodoService);

  //Signals
  users = this.userService.members;
  currentMember = this.todoService.currentMember;
  isLoading = this.todoService.isLoading;
  todosFormMember = this.todoService.filteredToDos;
  errorMessage = this.todoService.errorMessage;

  onSelect(ele: EventTarget | null) {
    this.todoService.getTodosForMember(
      Number((ele as HTMLSelectElement).value)
    );
  }

  onFilter(ele: EventTarget | null) {
    this.todoService.filterTodos((ele as HTMLInputElement).checked)
  }

  onChangeStatus(task: ToDo, ele: EventTarget | null) {
    this.todoService.changeStatus(task, (ele as HTMLInputElement).checked);
  }
}
