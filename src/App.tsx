import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	Container,
	TextField,
	Button,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	CircularProgress,
	Grid,
	Box,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { useForm, SubmitHandler } from "react-hook-form";

interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

type FormData = {
	todoText: string;
};

const App: React.FC = () => {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [editText, setEditText] = useState("");
	const [editTodo, setEditTodo] = useState<Todo | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
	const [hasTodos, setHasTodos] = useState(false);
	const [isLoading, setLoading] = useState(true);
	const [isAddingTodo, setIsAddingTodo] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormData>();

	const apiUrl = "https://e0fabcf0f3134fa0.mokky.dev/users";

	useEffect(() => {
		const fetchTodos = async () => {
			try {
				const response = await axios.get(apiUrl);
				setTodos(response.data);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching todos:", error);
				setLoading(false);
			}
		};

		fetchTodos();
	}, []);

	useEffect(() => {
		setHasTodos(todos.length > 0);
	}, [todos]);

	useEffect(() => {
		if (todos.length > 0 && todos.every((todo) => todo.completed)) {
			setToggleAllButtonText("Отменить");
		} else {
			setToggleAllButtonText("Выполнить");
		}
	}, [todos]);

	const [toggleAllButtonText, setToggleAllButtonText] =
		useState("Complete All");

	const handleAddTodo: SubmitHandler<FormData> = async (data) => {
		if (data.todoText.trim() !== "") {
			const newTodo = {
				id: Date.now(),
				text: data.todoText,
				completed: false,
			};
			try {
				setIsAddingTodo(true);

				const response = await axios.post(apiUrl, newTodo);
				setTodos([...todos, response.data]);
				reset();
			} catch (error) {
				console.error("Error adding todo:", error);
			} finally {
				setIsAddingTodo(false);
			}
		}
	};

	const handleDeleteTodo = async (id: number) => {
		try {
			await axios.delete(`${apiUrl}/${id}`);
			setTodos(todos.filter((todo) => todo.id !== id));
			setDeleteId(null);
		} catch (error) {
			console.error("Error deleting todo:", error);
		}
	};

	const handleEditTodo = (todo: Todo) => {
		setEditTodo(todo);
		setEditText(todo.text);
	};

	const handleSaveEdit = async () => {
		if (editTodo) {
			try {
				const updatedTodo = { ...editTodo, text: editText };
				const response = await axios.patch(
					`${apiUrl}/${editTodo.id}`,
					updatedTodo
				);
				setTodos(
					todos.map((todo) => (todo.id === editTodo.id ? response.data : todo))
				);
				setEditTodo(null);
			} catch (error) {
				console.error("Error updating todo:", error);
			}
		}
	};

	const handleToggleCompleteAll = async () => {
		const allCompleted = todos.every((todo) => todo.completed);
		const updatedTodos = todos.map((todo) => ({
			...todo,
			completed: !allCompleted,
		}));
		try {
			await Promise.all(
				updatedTodos.map((todo) => axios.patch(`${apiUrl}/${todo.id}`, todo))
			);
			setTodos(updatedTodos);
		} catch (error) {
			console.error("Error toggling complete all todos:", error);
		}
	};

	const handleToggleComplete = async (id: number) => {
		const todoToToggle = todos.find((todo) => todo.id === id);
		if (todoToToggle) {
			const updatedTodo = {
				...todoToToggle,
				completed: !todoToToggle.completed,
			};
			try {
				const response = await axios.patch(`${apiUrl}/${id}`, updatedTodo);
				setTodos(todos.map((todo) => (todo.id === id ? response.data : todo)));
			} catch (error) {
				console.error("Error toggling todo:", error);
			}
		}
	};

	const handleDeleteAll = async () => {
		try {
			await Promise.all(
				todos.map((todo) => axios.delete(`${apiUrl}/${todo.id}`))
			);
			setTodos([]);
			setShowDeleteAllDialog(false);
		} catch (error) {
			console.error("Error deleting all todos:", error);
		}
	};

	if (isLoading) {
		return (
			<Container
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}>
				<CircularProgress />
			</Container>
		);
	}

	return (
		<Container>
			<Grid container spacing={2}>
				<div>
					<Box
						sx={{
							display: "flex",
							gap: "30px",
							position: "relative",
							left: "15px",
						}}>
						<p style={{ fontFamily: "arial" }}>Всего задач: {todos.length}</p>
						<p style={{ fontFamily: "arial" }}>
							Выполнено: {todos.filter((todo) => todo.completed).length}
						</p>
						<p style={{ fontFamily: "arial" }}>
							Не выполнено: {todos.filter((todo) => !todo.completed).length}
						</p>
					</Box>
				</div>
			</Grid>
			<form
				onSubmit={handleSubmit(handleAddTodo)}
				style={{ marginBottom: "20px" }}>
				<TextField
					{...register("todoText", { required: true })}
					label="Введите текст"
					fullWidth
					error={!!errors.todoText}
					helperText={errors.todoText ? "Заполните поле" : ""}
				/>
				<br />
				<br />
				<Box sx={{ display: "grid", gap: "10px" }}>
					<Button variant="contained" fullWidth type="submit">
						Добавить
					</Button>
					<Button
						variant="contained"
						fullWidth
						onClick={handleToggleCompleteAll}
						style={{ marginRight: "10px" }}
						disabled={!hasTodos}>
						{toggleAllButtonText}
					</Button>
					<Button
						variant="contained"
						color="error"
						fullWidth
						onClick={() => setShowDeleteAllDialog(hasTodos ? true : false)}
						startIcon={<Delete />}
						disabled={!hasTodos}>
						Удалить все
					</Button>
				</Box>
			</form>
			{isAddingTodo && ( // Условный рендеринг индикатора загрузки
				<CircularProgress style={{ margin: "20px auto", display: "block" }} />
			)}
			<List>
				{todos.map((todo) => (
					<ListItem key={todo.id}>
						<Checkbox
							checked={todo.completed}
							onChange={() => handleToggleComplete(todo.id)}
						/>
						<ListItemText
							primary={todo.text}
							style={{
								textDecoration: todo.completed ? "line-through" : "none",
							}}
						/>
						<IconButton onClick={() => handleEditTodo(todo)}>
							<Edit />
						</IconButton>
						<IconButton onClick={() => setDeleteId(todo.id)}>
							<Delete />
						</IconButton>
					</ListItem>
				))}
			</List>
			<Dialog open={Boolean(editTodo)} onClose={() => setEditTodo(null)}>
				<DialogTitle>Изменить</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSaveEdit();
								setEditTodo(null);
							}
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditTodo(null)} variant="contained">
						Отмена
					</Button>
					<Button onClick={handleSaveEdit} variant="contained">
						Ок
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
				<DialogTitle>Подтверждение удаления</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Вы действительно хотите удалить задачу?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteId(null)} variant="contained">
						Отмена
					</Button>
					<Button
						color="error"
						variant="contained"
						onClick={() => deleteId !== null && handleDeleteTodo(deleteId)}>
						Удалить
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={showDeleteAllDialog}
				onClose={() => setShowDeleteAllDialog(false)}>
				<DialogTitle>Подтверждение удаления всех задач</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Вы действительно хотите удалить все задачи ?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setShowDeleteAllDialog(false)}
						variant="contained">
						Отмена
					</Button>
					<Button onClick={handleDeleteAll} variant="contained" color="error">
						Удалить все
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default App;
