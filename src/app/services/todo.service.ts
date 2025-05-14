import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User, UserService } from './user.service';
import {
  catchError,
  delay,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  todoUrl = 'http://jsonplaceholder.typicode.com/todos';

  //Services
  private http = inject(HttpClient);
  private userService = inject(UserService);

  //Stor
  private state = signal<ToDoState>({
    isLoading: false,
    currentMember: undefined,
    memberToDos: [],
    error: null,
  });

  //Selectors
  isLoading = computed(() => this.state().isLoading);
  currentMember = computed(() => this.state().currentMember);
  toDos = computed(() => this.state().memberToDos);
  errorMessage = computed(() => this.state().error);

  private selectedIdSubject = new Subject<number>();
  private selectedId$ = this.selectedIdSubject.asObservable();

  constructor() {
    this.selectedId$
      .pipe(
        tap(() => this.setLoadingIndicator(true)),
        tap((id) => this.setCurrentMember(id)),
        switchMap((id) => this.getToDos(id)),
        delay(1000),
        takeUntilDestroyed()
      )
      .subscribe((todos) => this.setMemberToDos(todos));
  }

  //Reducers
  private setError(err: HttpErrorResponse): Observable<ToDo[]> {
    this.state.update((state) => ({
      ...state,
      error: setErrorMessage(err),
    }));
    return of([]);
  }

  private setMemberToDos(todos: ToDo[]): void {
    this.state.update((state) => ({
      ...state,
      memberToDos: todos,
      isLoading: false,
    }));
  }

  private getToDos(id: number): Observable<ToDo[]> {
    return this.http.get<ToDo[]>(`${this.todoUrl}?userId=${id}`).pipe(
      map((data) =>
        data.map((t) =>
          t.title.length > 20 ? { ...t, title: t.title.substring(0, 20) } : t
        )
      ),
      catchError((err) => this.setError(err))
    );
  }

  private setCurrentMember(id: number): void {
    const member = this.userService.getCurrentMember(id);
    this.state.update((state) => ({
      ...state,
      currentMember: member,
      memberToDos: [],
    }));
  }

  private setLoadingIndicator(isLoading: boolean): void {
    this.state.update((state) => ({
      ...state,
      isLoading,
    }));
  }

  getTodosForMember(memberId: number) {
    this.selectedIdSubject.next(memberId);
  }
}

export interface ToDo {
  userId: number;
  id: number;
  title: string;
  complete: boolean;
}

export interface ToDoState {
  isLoading: boolean;
  currentMember: User | undefined;
  memberToDos: ToDo[];
  error: string | null;
}

// This should be somewhere reusable
export function setErrorMessage(err: HttpErrorResponse): string {
  let errorMessage: string;
  if (err.error instanceof ErrorEvent) {
    // A client-side or network error occurred. Handle it accordingly.
    errorMessage = `An error occurred: ${err.error.message}`;
  } else {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    errorMessage = `Backend returned code ${err.status}: ${err.message}`;
  }
  console.error(err);
  return errorMessage;
}
